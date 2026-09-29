#!/usr/bin/env python3
import json, os, threading, time, uuid, socket
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(ROOT, 'data')
STATE_FILE = os.path.join(ROOT, 'shared_state.json')
HOST = os.environ.get('CS2_HOST', '0.0.0.0')
PORT = int(os.environ.get('CS2_PORT', '8000'))

LOCK = threading.RLock()
SSE_CLIENTS = []
SEEN_OPS = []


def read_json(path, fallback=None):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def base_state():
    return {
        'players': read_json(os.path.join(DATA_DIR, 'players.json'))['players'],
        'maps': read_json(os.path.join(DATA_DIR, 'maps.json'))['maps'],
        'matches': read_json(os.path.join(DATA_DIR, 'matches.json'))['matches'],
        'aliases': read_json(os.path.join(DATA_DIR, 'aliases.json'))['aliases'],
    }


def load_state():
    if os.path.exists(STATE_FILE):
        try:
            obj = read_json(STATE_FILE, None)
            if all(k in obj for k in ('players','maps','matches','aliases')):
                return obj
        except Exception:
            pass
    state = base_state()
    save_state(state, [])
    return state


def save_state(state, audit):
    payload = {
        'version': 1,
        'updated_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'players': state['players'],
        'maps': state['maps'],
        'matches': state['matches'],
        'aliases': state['aliases'],
        'audit': audit[-500:],
    }
    tmp = STATE_FILE + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
        f.flush(); os.fsync(f.fileno())
    os.replace(tmp, STATE_FILE)


def apply_op(state, op):
    kind = op.get('kind')
    if kind == 'map':
        state['maps'].append(op['map'])
    elif kind == 'match':
        state['matches'].append(op['match'])
    elif kind == 'player':
        state['players'].append(op['player'])
    elif kind == 'aliases':
        state['aliases'].update(op.get('aliases') or {})
    elif kind in ('player_patch','match_patch','map_patch'):
        key = {'player_patch':'players','match_patch':'matches','map_patch':'maps'}[kind]
        idkey = {'player_patch':'player_id','match_patch':'match_id','map_patch':'map_id'}[kind]
        target = next((x for x in state[key] if x.get(idkey) == op.get(idkey)), None)
        if target is None:
            raise ValueError(f'Объект не найден: {kind}')
        target.update(op.get('patch') or {})
    else:
        raise ValueError('Неизвестная операция')


def commit(operations, audit_entry):
    global SEEN_OPS
    with LOCK:
        state = load_state()
        audit = state.get('audit', [])
        applied = 0
        for op in operations:
            oid = op.get('_sync_id')
            if oid and oid in SEEN_OPS:
                continue
            clean = dict(op); clean.pop('_sync_id', None)
            apply_op(state, clean)
            applied += 1
            if oid:
                SEEN_OPS.append(oid)
        if audit_entry:
            audit.append(audit_entry)
        save_state(state, audit)
        version = int(time.time() * 1000)
    broadcast(version)
    return version, applied


def get_state():
    with LOCK:
        return load_state()


def broadcast(version):
    payload = f"event: update\ndata: {json.dumps({'version': version}, ensure_ascii=False)}\n\n".encode('utf-8')
    dead = []
    with LOCK:
        clients = list(SSE_CLIENTS)
    for w in clients:
        try:
            w.write(payload); w.flush()
        except Exception:
            dead.append(w)
    if dead:
        with LOCK:
            for w in dead:
                if w in SSE_CLIENTS:
                    SSE_CLIENTS.remove(w)


class Handler(SimpleHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def log_message(self, fmt, *args):
        print('[CS2]', fmt % args)

    def send_json(self, code, obj):
        raw = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(raw)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self):
        path = urlparse(self.path).path
        if path == '/api/state':
            self.send_json(200, get_state()); return
        if path == '/api/health':
            self.send_json(200, {'ok': True, 'service': 'CS2 Analytics shared server'}); return
        if path == '/api/events':
            self.send_response(200)
            self.send_header('Content-Type', 'text/event-stream; charset=utf-8')
            self.send_header('Cache-Control', 'no-cache')
            self.send_header('Connection', 'keep-alive')
            self.end_headers()
            try:
                self.wfile.write(b': connected\n\n'); self.wfile.flush()
                with LOCK: SSE_CLIENTS.append(self.wfile)
                while True:
                    time.sleep(15)
                    self.wfile.write(b': ping\n\n'); self.wfile.flush()
            except Exception:
                pass
            finally:
                with LOCK:
                    if self.wfile in SSE_CLIENTS: SSE_CLIENTS.remove(self.wfile)
            return
        return super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        if path != '/api/commit':
            self.send_json(404, {'ok': False, 'error': 'Not found'}); return
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if length > 2_000_000:
                raise ValueError('Payload too large')
            body = json.loads(self.rfile.read(length).decode('utf-8'))
            ops = body.get('operations')
            if not isinstance(ops, list) or not ops:
                raise ValueError('Нет операций для сохранения')
            audit = body.get('audit')
            if audit is not None and not isinstance(audit, dict):
                raise ValueError('Некорректный audit')
            version, applied = commit(ops, audit)
            self.send_json(200, {'ok': True, 'version': version, 'applied': applied})
        except Exception as e:
            self.send_json(400, {'ok': False, 'error': str(e)})


def local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]; s.close(); return ip
    except Exception:
        return '127.0.0.1'


if __name__ == '__main__':
    os.chdir(ROOT)
    with LOCK:
        st = load_state()
        print(f'CS2 Analytics shared server: {len(st["players"])} players, {len(st["maps"])} maps, {len(st["matches"])} matches')
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f'Local:   http://127.0.0.1:{PORT}/')
    print(f'Network: http://{local_ip()}:{PORT}/')
    print('Shared state: shared_state.json')
    print('Press Ctrl+C to stop.')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\\nServer stopped.')
    finally:
        server.server_close()
