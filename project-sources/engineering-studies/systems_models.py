"""Reproducible scientific and operational fixtures, independent of live systems."""
import json
import math
from pathlib import Path
import numpy as np


def gnp_audit():
    data=json.loads((Path(__file__).parent/'fixtures'/'gnp-recorded.json').read_text())
    rows=[]
    for case in data['cases']:
        truth=np.asarray(case['truth']);pred=np.asarray(case['gnp']);baseline=np.asarray(case['baseline'])
        if truth.shape!=pred.shape or truth.shape!=baseline.shape or not np.all(np.isfinite([truth,pred,baseline])):
            raise ValueError('Mismatched or nonfinite saved benchmark arrays')
        rows.append(dict(label=case['label'],n=len(truth),gnp_mae=float(np.mean(abs(pred-truth))),
                         baseline_mae=float(np.mean(abs(baseline-truth))),recorded_seconds=case['seconds']))
    return dict(rows=rows,provenance=data['provenance'],
                scope='Recomputed errors of six recorded runs; no new neural inference or paper benchmark reproduction')


def pde_inverse(radius=1.,diffusion=.2,time=1.,grid_points=501):
    if radius<=0 or diffusion<0 or time<0 or not np.isfinite(radius+diffusion+time): raise ValueError('Require r>0, D>=0, t>=0')
    if type(grid_points) is not int or not 101<=grid_points<=10001: raise ValueError('Use 101..10001 grid points')
    decay=math.exp(-2*diffusion*time/radius**2)
    # The same analytic sphere mode as the browser; independent implementation.
    poles=[.5+.5*decay,.5-.5*decay]
    observations=np.array([.98,1.04,1.01]);sigma=.05
    radii=np.linspace(.4,2.5,grid_points)
    logp=-np.sum((observations[:,None]-1/radii**2)**2,axis=0)/(2*sigma*sigma)
    posterior=np.exp(logp-logp.max());posterior/=posterior.sum();cdf=np.cumsum(posterior)
    interval=[float(radii[np.searchsorted(cdf,q)]) for q in (.025,.975)]
    return dict(north=poles[0],south=poles[1],mean_field=.5,decay=decay,
                posterior_mean=float(posterior@radii),interval95=interval,
                posterior_sum=float(posterior.sum()),grid_spacing=float(radii[1]-radii[0]))


def kuramoto(dt=.02,seed=7,coupling=1.2,n=12,duration=4.):
    if not .001<=dt<=.1 or not 2<=n<=100 or not 0<=coupling<=10 or not .1<=duration<=20: raise ValueError('Unsupported teaching scale')
    rng=np.random.default_rng(seed)
    upper=np.triu(rng.random((n,n))<.25,1);a=(upper|upper.T).astype(float)
    omega=rng.uniform(-.8,.8,n);initial=rng.uniform(0,2*np.pi,n);degree=np.maximum(1,a.sum(1))
    def integrate(step):
        count=int(round(duration/step)); actual_step=duration/count;theta=initial.copy()
        for _ in range(count):
            # theta_j - theta_i for row i, column j.
            influence=np.sum(a*np.sin(theta[None,:]-theta[:,None]),axis=1)/degree
            theta+=actual_step*(omega+coupling*influence)
        return theta,float(abs(np.exp(1j*theta).mean()))
    coarse,rc=integrate(dt);fine,rf=integrate(dt/2)
    difference=np.angle(np.exp(1j*(coarse-fine)))
    return dict(order_coarse=rc,order_fine=rf,phase_rms_difference=float(np.sqrt(np.mean(difference**2))),
                edges=int(a.sum()/2),seed=seed,dt=dt,duration=duration,
                scope='Euler convergence comparison on one fixed seeded graph, not universal synchronization evidence')


def hpc(workers=8,parallel_fraction=.8,peak=1000.,bandwidth=100.,intensity=2.):
    if type(workers) is not int or workers<1 or not 0<=parallel_fraction<=1 or min(peak,bandwidth,intensity)<=0: raise ValueError('Invalid model parameters')
    speedup=1/((1-parallel_fraction)+parallel_fraction/workers)
    ranks=np.array_split(np.arange(1,101,dtype=np.int64),workers)
    partial=[int(x.sum()) for x in ranks]
    return dict(amdahl_speedup=speedup,roofline_gflops=min(peak,bandwidth*intensity),
                ridge_flops_per_byte=peak/bandwidth,simulated_reduce=sum(partial),partial_sums=partial,
                communication='sequential rank simulation; use mpi_sum.py under mpiexec for actual MPI')


def kubernetes(started=True,ready=False,live=True):
    # These decisions are deliberately separate. No Kubernetes API is called.
    if any(type(x) is not bool for x in (started,ready,live)): raise ValueError('Probe states must be booleans')
    return dict(startup_complete=started,readiness_evaluated=started,liveness_evaluated=started,
                eligible_endpoint=started and ready,restart_requested=started and not live,
                recovery_plan=['Inspect pod events and probe results','Check application dependencies','Fix or roll back the failed change','Verify endpoint membership and application response'],
                scope='one probe decision instant; thresholds, delays, backoff, network policy and controller timing omitted')


def security(seed=7,cases=40):
    if type(cases) is not int or not 1<=cases<=10000: raise ValueError('Bound the local corpus to 1..10000 cases')
    rng=np.random.default_rng(seed)
    def parse(line):
        parts=line.split(',')
        if len(parts)!=2 or not parts[0].strip() or not parts[1].strip(): raise ValueError('Two nonempty fields required')
        value=float(parts[1])
        if not math.isfinite(value): raise ValueError('Finite reading required')
        return parts[0].strip(),value
    valid=[f'sensor-{i},{rng.normal():.8f}' for i in range(cases)]
    invalid=['',',1','sensor,','sensor,NaN','sensor,inf','sensor,1,extra']
    accepted=sum(parse(line) is not None for line in valid);rejected=0
    for line in invalid:
        try: parse(line)
        except ValueError: rejected+=1
    # Fictional local event fixture: thresholding is a detection rule, not a verdict.
    events=[{'user':'alice','failed_logins':5,'malicious_label':True},
            {'user':'bob','failed_logins':4,'malicious_label':False},
            {'user':'carol','failed_logins':1,'malicious_label':True},
            {'user':'drew','failed_logins':0,'malicious_label':False}]
    threshold=3;pred=[e['failed_logins']>=threshold for e in events];labels=[e['malicious_label'] for e in events]
    confusion=[[sum(y==t and p==q for y,p in zip(labels,pred)) for q in (False,True)] for t in (False,True)]
    return dict(valid_accepted=accepted,invalid_rejected=rejected,invalid_total=len(invalid),
                detection_confusion=confusion,scope='bounded fictional local parser and labeled detection fixtures; no host scanning')


def constraint(scores=(.8,.6,.7),capacity=2):
    if len(scores)!=3 or not all(math.isfinite(s) for s in scores) or type(capacity) is not int or not 0<=capacity<=3: raise ValueError('Three finite scores and integer capacity 0..3')
    # Learned scores rank candidates; explicit constraints define feasibility.
    feasible=[]
    for i in range(8):
        choice=tuple((i>>j)&1 for j in range(3))
        if sum(choice)<=capacity and not(choice[0] and choice[2]):
            feasible.append((sum(s*c for s,c in zip(scores,choice)),choice))
    best=max(feasible)
    return dict(selected=list(best[1]),objective=best[0],feasible_count=len(feasible),
                unconstrained_pick=[int(s>=.5) for s in scores],
                scope='enumerated three-variable exact constraint solver; scores are fixed fixtures, not calibrated probabilities')


def reinforcement(seed=7,episodes=300):
    if type(episodes) is not int or not 1<=episodes<=10000: raise ValueError('Use 1..10000 episodes')
    rng=np.random.default_rng(seed);q=np.zeros((5,2));alpha=.3;gamma=.9
    def transition(s,a):
        ns=min(4,max(0,s+(1 if a else -1)))
        return ns,1. if ns==4 else -.02,ns==4
    for _ in range(episodes):
        s=0
        for _ in range(30):
            a=int(rng.integers(2)) if rng.random()<.2 else int(np.argmax(q[s]))
            ns,reward,done=transition(s,a)
            target=reward+(0 if done else gamma*np.max(q[ns]))
            q[s,a]+=alpha*(target-q[s,a]);s=ns
            if done:break
    state=0;trajectory=[0];reward_sum=0
    for _ in range(10):
        state,reward,done=transition(state,int(np.argmax(q[state])));trajectory.append(state);reward_sum+=reward
        if done:break
    return dict(q=q.tolist(),trajectory=trajectory,undiscounted_return=reward_sum,
                optimal_plan=[0,1,2,3,4],seed=seed,reached_goal=state==4,
                scope='five-state deterministic chain; compare multiple seeds and held-out dynamics before generalizing')
