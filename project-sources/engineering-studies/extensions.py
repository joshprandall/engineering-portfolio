"""Explicitly bounded extensions for the AI and advanced quantum study pages."""
import math
import numpy as np
from ai_models import softmax,agent


def diffusion(seed=7,alpha_bar=.4):
    if not 0<alpha_bar<1: raise ValueError('Use 0<alpha_bar<1')
    rng=np.random.default_rng(seed);x0=rng.normal(size=4000);noise=rng.normal(size=4000)
    xt=np.sqrt(alpha_bar)*x0+np.sqrt(1-alpha_bar)*noise
    # Fit on the first half; evaluate only on the second half.
    coefficient=float(xt[:2000]@x0[:2000]/(xt[:2000]@xt[:2000]))
    prediction=coefficient*xt[2000:]
    return dict(fitted_coefficient=coefficient,gaussian_optimal_coefficient=math.sqrt(alpha_bar),
                heldout_mse=float(np.mean((prediction-x0[2000:])**2)),optimal_expected_mse=1-alpha_bar,
                scope='one scalar forward-noising level and fitted denoiser; not a trained image diffusion model')


def vision():
    image=np.zeros((7,7));image[:,3:]=1
    sobel=np.array([[-1,0,1],[-2,0,2],[-1,0,1]],float)
    def correlate(x):
        return np.array([[np.sum(x[i:i+3,j:j+3]*sobel) for j in range(5)] for i in range(5)])
    edge=correlate(image);shift=correlate(image+.3)
    return dict(edge_map=edge.tolist(),maximum_response=float(edge.max()),
                brightness_shift_residual=float(np.max(abs(edge-shift))),
                boundary='valid correlation; no padding, image normalization, trained detector, or object recognition')


def multimodal(image_weight=.5,missing=False):
    if not 0<=image_weight<=1 or type(missing) is not bool: raise ValueError('Weight in [0,1], boolean missing flag')
    text=np.array([.9,.1]); image=np.array([.1,.9])
    fused=text if missing else (1-image_weight)*text+image_weight*image
    return dict(text=text.tolist(),image=None if missing else image.tolist(),fused=fused.tolist(),
                decision=int(np.argmax(fused)),disagreement=not missing,
                scope='late fusion of two fictional calibrated-score vectors; calibration and label alignment are assumptions')


def robot(x=1.,y=1.):
    if not np.isfinite(x+y): raise ValueError('Finite target required')
    c=(x*x+y*y-2)/2
    if not -1<=c<=1: raise ValueError('Target is outside the two unit-link workspace')
    q2=math.acos(c);q1=math.atan2(y,x)-math.atan2(math.sin(q2),1+math.cos(q2))
    endpoint=[math.cos(q1)+math.cos(q1+q2),math.sin(q1)+math.sin(q1+q2)]
    return dict(joint_radians=[q1,q2],endpoint=endpoint,residual=math.hypot(endpoint[0]-x,endpoint[1]-y),
                scope='planar position inverse kinematics, one elbow branch; collisions, torque and joint limits omitted')


def personal(consent=False,now=10,expiry=20):
    if type(consent) is not bool or not np.isfinite(now+expiry): raise ValueError('Boolean consent and finite times')
    record={'text':'Fictional preference: show SI units','expires_at':expiry,'purpose':'display preference'}
    memory=[record] if consent and now<expiry else []
    return dict(memory=memory,stored=bool(memory),expires_at=expiry,
                scope='ephemeral fixture; no account, real personal data, or hidden retention')


def build_system():
    success=agent(fail_after_effect=True)
    denied=False
    try: agent(allowed=False)
    except PermissionError: denied=True
    conflict=False
    try: agent(conflicting_retry=True)
    except ValueError: conflict=True
    return dict(one_effect=success['effect_count']==1,permission_denied=denied,conflict_rejected=conflict,
                scope='three integration acceptance checks for a bounded local tool executor')


def cache():
    k=np.array([[1.,0.],[0.,1.]]);v=np.array([[.2,.7],[-.4,.3]]);q=np.array([[.5,.5]])
    new_k=np.array([[1.,1.]]);new_v=np.array([[.6,.2]])
    full_k=np.concatenate([k,new_k]);full_v=np.concatenate([v,new_v])
    full=softmax(q@full_k.T/np.sqrt(2))@full_v
    cached_k=k.copy();cached_v=v.copy()
    cached_k=np.vstack([cached_k,new_k]);cached_v=np.vstack([cached_v,new_v])
    incremental=softmax(q@cached_k.T/np.sqrt(2))@cached_v
    return dict(output=full.tolist(),cached_output=incremental.tolist(),maximum_difference=float(np.max(abs(full-incremental))),
                example_bytes=2*32*4096*8*128*2,
                memory_formula='2 × layers × cached tokens × KV heads × head dimension × bytes/element; batch=1')


def quantization(bits=8):
    if type(bits) is not int or not 2<=bits<=8: raise ValueError('Use 2..8 signed symmetric bits')
    weights=np.array([-.8,-.1,.3,1.2]);limit=2**(bits-1)-1;scale=float(max(abs(weights))/limit)
    integers=np.clip(np.rint(weights/scale),-limit,limit).astype(int);restored=integers*scale
    return dict(scale=scale,integers=integers.tolist(),restored=restored.tolist(),
                maximum_error=float(max(abs(weights-restored))),half_step=scale/2,
                scope='per-tensor symmetric weight quantization; no kernel latency or end-task accuracy claim')


def lora(seed=7,steps=200):
    if type(steps) is not int or not 1<=steps<=10000: raise ValueError('Use 1..10000 steps')
    rng=np.random.default_rng(seed);base=rng.normal(size=(6,8));before=base.copy()
    target=rng.normal(size=(6,2))@rng.normal(size=(2,8))*.1
    a=rng.normal(size=(2,8))*.1;b=np.zeros((6,2));initial=float(np.mean(target**2))
    for _ in range(steps):
        difference=b@a-target
        grad_b=2*difference@a.T/difference.size;grad_a=2*b.T@difference/difference.size
        a-=grad_a;b-=grad_b
    return dict(initial_loss=initial,final_loss=float(np.mean((b@a-target)**2)),
                base_unchanged=bool(np.array_equal(base,before)),adapter_parameters=a.size+b.size,
                dense_parameters=base.size,rank=int(np.linalg.matrix_rank(b@a)),
                scope='fit a rank-two matrix update; base frozen; no language-model fine-tuning run')


def game(stones=5):
    if type(stones) is not int or not 1<=stones<=30: raise ValueError('Use 1..30 stones')
    value=[False]*(stones+1);move=[None]*(stones+1)
    for n in range(1,stones+1):
        for take in (1,2):
            if take<=n and not value[n-take]:value[n]=True;move[n]=take;break
    return dict(winning=value[stones],optimal_take=move[stones],winning_states=value,
                scope='perfect-information normal-play subtraction game, take 1 or 2; exact dynamic programming')


def fault_tolerance(p=.01,rounds=1):
    if not 0<=p<=.05 or type(rounds) is not int or not 1<=rounds<=3: raise ValueError('Small-error model: 0<=p<=.05 and 1..3 rounds')
    out=p
    for _ in range(rounds):out=35*out**3
    return dict(leading_order_output_error=out,input_states_per_output=15**rounds,
                scope='idealized 15-to-1 distillation leading-order 35p³ recurrence; ignores rejection, correlated errors, Clifford faults, routing and factory overhead')
