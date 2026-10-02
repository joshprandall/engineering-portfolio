"""Optional pinned-upstream adapter. It neither downloads nor installs models."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import time
import numpy as np

REVISION='4ba306ac20f5674b773a8ba980aabeef33ed5385'
WEIGHTS={'clean_30k':'7c2f7742e68998980fd8c79e4b4d45356c460e9c1edc6a947a1b5b7cb2a6bf28',
         'noise_70k':'c99504593443c6d161ef00d2f9af04e1c6423840ad875e12bd517b1e16448230'}


def load_input(path):
    with np.load(path,allow_pickle=False) as data:
        points=np.asarray(data['points'],dtype=np.float32)
        normals=np.asarray(data['normals'],dtype=np.float32)
    if points.ndim!=2 or points.shape[1]!=3 or points.shape!=normals.shape or not 32<=len(points)<=100000:
        raise ValueError('Use matching (N,3) arrays with 32..100000 points')
    if not np.isfinite(points).all() or not np.isfinite(normals).all():raise ValueError('Nonfinite input')
    lengths=np.linalg.norm(normals,axis=1)
    if np.any(lengths<1e-8):raise ValueError('Normal vectors must be nonzero')
    return points,normals/lengths[:,None]


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input',type=Path);parser.add_argument('output',type=Path)
    parser.add_argument('--upstream',required=True,type=Path)
    parser.add_argument('--model',choices=WEIGHTS,default='clean_30k')
    parser.add_argument('--validate-only',action='store_true');args=parser.parse_args()
    points,normals=load_input(args.input)
    if args.validate_only:
        print(json.dumps({'valid':True,'points':len(points),'normal_policy':'normalized supplied vectors','inference':False}));return
    actual=subprocess.check_output(['git','-C',str(args.upstream),'rev-parse','HEAD'],text=True).strip()
    if actual!=REVISION:raise ValueError('Upstream checkout is not the pinned revision')
    if subprocess.check_output(['git','-C',str(args.upstream),'status','--porcelain','--untracked-files=no'],text=True).strip():raise ValueError('Upstream tracked files must be clean')
    weight=args.upstream/'gnp'/'model_weights'/args.model/'state_dict.pth'
    digest=hashlib.sha256(weight.read_bytes()).hexdigest()
    if digest!=WEIGHTS[args.model]:raise ValueError('Weight checksum mismatch')
    sys.path.insert(0,str(args.upstream.resolve()))
    import torch
    from gnp.estimator import GeometryEstimator
    torch.set_num_threads(2)
    start=time.perf_counter()
    estimator=GeometryEstimator(torch.from_numpy(points),torch.from_numpy(normals),model_name=args.model,device='cpu')
    predictions=estimator.estimate_quantities(['gaussian_curvature'])['gaussian_curvature'].detach().cpu().numpy().reshape(-1)
    elapsed=time.perf_counter()-start
    if len(predictions)!=len(points) or not np.isfinite(predictions).all():raise ValueError('Invalid prediction shape or values')
    result={'points':points.tolist(),'gnp':predictions.tolist(),'provenance':{'revision':REVISION,'model':args.model,'weight_sha256':digest,'torch':torch.__version__,'numpy':np.__version__,'device':'CPU','threads':2,'seconds':elapsed,'normal_policy':'caller-supplied vectors normalized; provenance not independently authenticated','timing':'estimator construction and quantity estimation; excludes imports and input loading'}}
    with args.output.open('x') as f:json.dump(result,f)
    print(f'Wrote {len(points)} predictions to {args.output}')


if __name__=='__main__':main()
