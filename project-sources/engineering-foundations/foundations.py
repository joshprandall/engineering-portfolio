"""Small deterministic models for the eight authored foundation lessons.

Python 3.10+, standard library only. No network or implicit file writes.
"""
from __future__ import annotations
import hashlib
import ipaddress
import json
import math
import sqlite3


def finite(value, low=-math.inf, high=math.inf):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError('Expected a number, not a boolean or string')
    if not math.isfinite(value) or not low <= value <= high:
        raise ValueError('Number is nonfinite or outside the supported range')
    return value


def prefix(address='192.168.10.70', bits=26):
    finite(bits, 0, 32)
    if int(bits) != bits:
        raise ValueError('Prefix must be an integer')
    net = ipaddress.IPv4Network(f'{address}/{int(bits)}', strict=False)
    return dict(network=str(net), upper=str(net.broadcast_address),
                total=net.num_addresses,
                usable=net.num_addresses - 2 if bits < 31 else net.num_addresses)


def eigen(matrix=((2, 1), (1, 2)), vector=(1, 1), eigenvalue=3):
    if len(matrix) != 2 or any(len(row) != 2 for row in matrix) or len(vector) != 2:
        raise ValueError('This experiment uses a 2 by 2 matrix and two-vector')
    for v in [*matrix[0], *matrix[1], *vector, eigenvalue]:
        finite(v, -1e6, 1e6)
    norm = math.hypot(*vector)
    if norm == 0:
        raise ValueError('An eigenvector must be nonzero')
    av = [sum(a*x for a, x in zip(row, vector)) for row in matrix]
    lv = [eigenvalue*x for x in vector]
    residual = math.hypot(*(a-b for a, b in zip(av, lv)))
    return dict(av=av, lv=lv, residual=residual, relative_to_vector=residual/norm)


def bayes(prior=.01, sensitivity=.9, false_positive=.05, population=10000):
    for p in (prior, sensitivity, false_positive):
        finite(p, 0, 1)
    finite(population, 1, 1e7)
    if int(population) != population:
        raise ValueError('Population must be an integer')
    tp = population*prior*sensitivity
    fp = population*(1-prior)*false_positive
    if tp + fp == 0:
        raise ValueError('The conditioning event has probability zero')
    return dict(true_positive=tp, false_positive=fp, posterior=tp/(tp+fp))


def qubit(theta=90, phi=90):
    t = math.radians(finite(theta, 0, 180))
    f = math.radians(finite(phi, -360, 360))
    bloch = [math.sin(t)*math.cos(f), math.sin(t)*math.sin(f), math.cos(t)]
    return dict(bloch=bloch, x_plus=(1+bloch[0])/2, y_plus=(1+bloch[1])/2,
                z_zero=(1+bloch[2])/2, norm=math.hypot(*bloch))


def bell(visibility=1, basis='X'):
    v = finite(visibility, 0, 1)
    if basis not in ('X', 'Y', 'Z'):
        raise ValueError('Basis must be X, Y, or Z')
    c = {'X': v, 'Y': -v, 'Z': 1}[basis]
    return dict(correlation=c, probabilities=[(1+c)/4, (1-c)/4, (1-c)/4, (1+c)/4],
                local_probability=.5, purity=(1+v*v)/2)


def recovery(rto=120, rpo=30, restore=95, age=45, validation='passed'):
    for x in (rto, rpo, restore, age):
        finite(x, 0, 100000)
    if validation not in ('passed', 'failed', 'not tested'):
        raise ValueError('Unknown validation state')
    return dict(rto_margin=rto-restore, rpo_margin=rpo-age,
                demonstrated=validation == 'passed' and restore <= rto and age <= rpo)


def validate_records(records):
    if not isinstance(records, list) or len(records) > 100:
        raise ValueError('Use a list with at most 100 records')
    clean, ids = [], set()
    for row in records:
        if not isinstance(row, dict) or set(row) != {'id', 'owner', 'count'}:
            raise ValueError('Each record must have exactly id, owner, and count')
        if any(not isinstance(row[k], str) or not row[k].strip() for k in ('id', 'owner')):
            raise ValueError('id and owner must be nonempty strings')
        if type(row['count']) is not int or not 0 <= row['count'] <= 2**53 - 1:
            raise ValueError('count must be a nonnegative safe integer')
        item = dict(id=row['id'].strip(), owner=row['owner'].strip(), count=row['count'])
        if item['id'] in ids:
            raise ValueError('Duplicate id in the same batch')
        ids.add(item['id'])
        clean.append(item)
    return clean


def database():
    """An isolated in-memory database. The caller owns and closes the connection."""
    db = sqlite3.connect(':memory:')
    db.executescript('''
      CREATE TABLE inventory(id TEXT PRIMARY KEY, owner TEXT NOT NULL,
                             count INTEGER NOT NULL CHECK(count >= 0));
      CREATE TABLE requests(key TEXT PRIMARY KEY, digest TEXT NOT NULL);
    ''')
    return db


def ingest(db, key, records, fail_after=None):
    """Atomic insert; retries with the same key AND same normalized payload are no-ops.

    A key reused with different data fails. Existing inventory IDs fail rather
    than silently overwriting a prior batch. The injected failure exercises
    rollback. This example assumes a dedicated connection with no open transaction.
    """
    if not isinstance(key, str) or not key.strip():
        raise ValueError('Provide a nonempty idempotency key')
    if db.in_transaction:
        raise ValueError('Use a connection with no active transaction')
    key = key.strip()
    rows = validate_records(records)
    payload = json.dumps(rows, sort_keys=True, separators=(',', ':')).encode()
    digest = hashlib.sha256(payload).hexdigest()
    with db:
        db.execute('BEGIN IMMEDIATE')
        prior = db.execute('SELECT digest FROM requests WHERE key=?', (key,)).fetchone()
        if prior:
            if prior[0] != digest:
                raise ValueError('Idempotency key was reused with a different payload')
            return dict(inserted=0, replay=True, digest=digest)
        for i, row in enumerate(rows, 1):
            db.execute('INSERT INTO inventory VALUES (?, ?, ?)', tuple(row.values()))
            if fail_after == i:
                raise RuntimeError('Injected failure before commit')
        db.execute('INSERT INTO requests VALUES (?, ?)', (key, digest))
    return dict(inserted=len(rows), replay=False, digest=digest)


def slo(target=99.9, requests=1000000, bad=1500):
    finite(target, 0, 100)
    finite(requests, 1, 1e12)
    finite(bad, 0, requests)
    if int(requests) != requests or int(bad) != bad:
        raise ValueError('Request counts must be integers')
    budget = requests*(100-target)/100
    return dict(success_percent=100*(1-bad/requests), allowed_bad=budget,
                remaining=budget-bad, consumed_percent=100*bad/budget if budget else None)


if __name__ == '__main__':
    print(json.dumps({name: globals()[name]() for name in
                     ('prefix', 'eigen', 'bayes', 'qubit', 'bell', 'recovery', 'slo')}, indent=2))
