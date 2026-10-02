"""Exact small-state simulations. No hardware backend, shots, or speedup claim."""
import math
import numpy as np

I=np.eye(2,dtype=complex)
X=np.array([[0,1],[1,0]],complex)
Y=np.array([[0,-1j],[1j,0]],complex)
Z=np.diag([1.,-1.]).astype(complex)
H=np.array([[1,1],[1,-1]],complex)/np.sqrt(2)


def probability(value):
    if not np.isfinite(value) or not 0<=value<=1: raise ValueError('Probability must be in [0,1]')
    return value


def density(gamma=.4):
    g=probability(gamma); plus=np.array([1.,1.])/np.sqrt(2); rho=np.outer(plus,plus)
    kraus=[np.diag([1,np.sqrt(1-g)]),np.array([[0,np.sqrt(g)],[0,0]])]
    out=sum(k@rho@k.conj().T for k in kraus)
    return dict(density=out.real.tolist(),trace=float(np.trace(out).real),
                eigenvalues=np.linalg.eigvalsh(out).tolist(),purity=float(np.trace(out@out).real),
                z_zero=float(out[0,0].real),coherence=float(out[0,1].real))


def kickback(phi=.125):
    if not np.isfinite(phi): raise ValueError('Finite phase required')
    phase=np.exp(2j*np.pi*phi)
    # Ancilla first; target |1> is an eigenstate of diag(1,e^(2πiφ)).
    initial=np.kron(np.array([1,1])/np.sqrt(2),np.array([0,1]))
    controlled=np.diag([1,1,1,phase]); final=controlled@initial
    after_h=np.kron(H,I)@final
    return dict(ancilla_zero_probability=float(np.sum(np.abs(after_h[:2])**2)),
                expected=math.cos(math.pi*phi)**2,target_one_probability=float(abs(final[1])**2+abs(final[3])**2))


def qft(bits=3):
    if type(bits) is not int or not 1<=bits<=8: raise ValueError('Use 1..8 qubits')
    n=2**bits; j=np.arange(n); matrix=np.exp(2j*np.pi*np.outer(j,j)/n)/np.sqrt(n)
    basis=np.eye(n)[:,1]; transformed=matrix@basis; restored=matrix.conj().T@transformed
    return dict(probabilities=np.abs(transformed).astype(float).__pow__(2).tolist(),
                unitary_residual=float(np.linalg.norm(matrix.conj().T@matrix-np.eye(n))),
                roundtrip_residual=float(np.linalg.norm(restored-basis)))


def qpe(phi=.125,bits=3):
    if not np.isfinite(phi) or not 0<=phi<1: raise ValueError('Use phase in [0,1)')
    if type(bits) is not int or not 1<=bits<=8: raise ValueError('Use 1..8 bits')
    n=2**bits; k=np.arange(n)
    # A direct inverse DFT of phase-kickback amplitudes, independent of the
    # closed-form sine quotient used by the existing browser lab.
    before=np.exp(2j*np.pi*phi*k)/np.sqrt(n)
    inverse=np.exp(-2j*np.pi*np.outer(k,k)/n)/np.sqrt(n)
    probabilities=np.abs(inverse@before)**2; grid=k/n
    linear=grid-phi; circular=(linear+.5)%1-.5
    return dict(probabilities=probabilities.tolist(),dominant=int(np.argmax(probabilities)),
                linear_rmse=float(np.sqrt(probabilities@linear**2)),
                circular_rmse=float(np.sqrt(probabilities@circular**2)),normalization=float(probabilities.sum()))


def grover(bits=3,marked=5,iterations=2):
    if type(bits) is not int or not 1<=bits<=8: raise ValueError('Use 1..8 qubits')
    n=2**bits
    if type(marked) is not int or not 0<=marked<n or type(iterations) is not int or not 0<=iterations<=100: raise ValueError('Invalid mark or iteration count')
    state=np.ones(n)/np.sqrt(n)
    for _ in range(iterations):
        state[marked]*=-1
        state=2*state.mean()-state
    expected=math.sin((2*iterations+1)*math.asin(1/math.sqrt(n)))**2
    return dict(marked_probability=float(state[marked]**2),expected=expected,
                normalization=float(state@state),probabilities=(state**2).tolist())


def order_finding(a=2,n=15):
    if type(a) is not int or type(n) is not int or not 2<=n<=10000 or not 1<a<n: raise ValueError('Use integer 1<a<N<=10000')
    gcd=math.gcd(a,n)
    if gcd>1: return dict(method='classical gcd',factors=[gcd,n//gcd])
    value=1; sequence=[]
    for r in range(1,n+1):
        value=(value*a)%n;sequence.append(value)
        if value==1: break
    factors=[]
    if r%2==0:
        x=pow(a,r//2,n)
        if x not in (1,n-1): factors=[math.gcd(x-1,n),math.gcd(x+1,n)]
    return dict(order=r,sequence=sequence,factors=factors,method='classical modular order search and Shor post-processing only')


def vqe(points=2001):
    if type(points) is not int or not 21<=points<=10001: raise ValueError('Use 21..10001 grid points')
    h=np.kron(Z,I)+np.kron(I,Z)+.5*np.kron(X,X)
    theta=np.linspace(0,np.pi,points)
    energies=2*np.cos(2*theta)+.5*np.sin(2*theta)
    i=int(np.argmin(energies)); state=np.array([np.cos(theta[i]),0,0,np.sin(theta[i])])
    expectation=float(np.vdot(state,h@state).real); exact=float(np.linalg.eigvalsh(h)[0])
    return dict(theta=float(theta[i]),variational_energy=expectation,exact_ground_energy=exact,
                error=expectation-exact,method='exact expectations; one-parameter grid minimization')


def repetition(p=.1):
    probability(p)
    syndromes={}; total_failure=0
    # Encode logical zero. Stabilizers Z0Z1 and Z1Z2 reveal bit-flip parity.
    corrections={(1,0):0,(1,1):1,(0,1):2}
    for i in range(8):
        e=[(i>>k)&1 for k in (2,1,0)]; syndrome=(e[0]^e[1],e[1]^e[2]); fixed=e.copy()
        if syndrome in corrections: fixed[corrections[syndrome]]^=1
        weight=sum(e); chance=p**weight*(1-p)**(3-weight)
        if any(fixed): total_failure+=chance
        syndromes[''.join(map(str,e))]=''.join(map(str,syndrome))
    return dict(syndromes=syndromes,logical_bit_error=total_failure,expected=3*p*p-2*p**3,
                phase_errors_corrected=False)


def qaoa(points=61):
    if type(points) is not int or not 11<=points<=201: raise ValueError('Use 11..201 points')
    cost=np.diag([0,1,1,0]); initial=np.ones(4,dtype=complex)/2
    best=(-1.,0.,0.)
    for gamma in np.linspace(0,np.pi,points):
        phased=np.exp(-1j*gamma*np.diag(cost))*initial
        for beta in np.linspace(0,np.pi/2,points):
            mix=np.cos(beta)*I-1j*np.sin(beta)*X
            state=np.kron(mix,mix)@phased
            score=float(np.vdot(state,cost@state).real)
            if score>best[0]: best=(score,float(gamma),float(beta))
    return dict(expected_cut=best[0],gamma=best[1],beta=best[2],exact_maximum=1,
                graph='one unweighted edge; depth p=1')


def hamiltonian(time=.7,steps=16):
    if not np.isfinite(time) or type(steps) is not int or not 1<=steps<=10000: raise ValueError('Finite time, 1..10000 steps')
    h=X+Z; eigenvalues,vectors=np.linalg.eigh(h)
    exact=(vectors*np.exp(-1j*time*eigenvalues))@vectors.conj().T
    step=(np.cos(time/steps)*I-1j*np.sin(time/steps)*X)@(np.cos(time/steps)*I-1j*np.sin(time/steps)*Z)
    approximate=np.linalg.matrix_power(step,steps)
    return dict(operator_error=float(np.linalg.norm(exact-approximate,2)),
                unitary_residual=float(np.linalg.norm(approximate.conj().T@approximate-I)))


def stabilizers():
    # A four-data-qubit stabilizer toy; not a complete surface-code memory.
    tensor=lambda seq: np.kron(np.kron(seq[0],seq[1]),np.kron(seq[2],seq[3]))
    checks=[tensor([X,X,X,X]),tensor([Z,Z,I,I]),tensor([I,Z,Z,I])]
    commutators=[float(np.linalg.norm(a@b-b@a)) for a in checks for b in checks]
    error=tensor([I,X,I,I])
    syndrome=[int(np.linalg.norm(s@error-error@s)>1e-9) for s in checks]
    return dict(maximum_commutator=max(commutators),x_on_qubit_one_syndrome=syndrome,
                scope='commutation and Pauli syndrome only; no decoder, measurement noise, threshold, or fault-tolerance estimate')


def hardware(time=20,t1=100,t2=80):
    if any(not np.isfinite(x) for x in (time,t1,t2)) or time<0 or t1<=0 or not 0<t2<=2*t1: raise ValueError('Require t>=0, T1>0 and 0<T2<=2T1')
    return dict(excited_survival=math.exp(-time/t1),coherence_fraction=math.exp(-time/t2),
                pure_dephasing_rate=1/t2-1/(2*t1),time_units='same arbitrary unit for t, T1, T2')


def network(visibility=.9,efficiency=.5):
    w=probability(visibility);eta=probability(efficiency)
    return dict(single_link_fidelity=(1+3*w)/4,swapped_fidelity=(1+3*w*w)/4,
                heralded_success=eta*eta/2,
                assumptions='independent Werner links; ideal swapping conditional on heralding; simplified linear-optical success model')


def sensing(n=4,gamma=.1,time=1):
    if type(n) is not int or not 1<=n<=100 or gamma<0 or time<=0 or not np.isfinite(gamma+time): raise ValueError('Use 1..100 probes, gamma>=0 and time>0')
    return dict(product_qfi=n*time*time*math.exp(-2*gamma*time),
                ghz_qfi=n*n*time*time*math.exp(-2*n*gamma*time),
                scope='frequency-estimation QFI with independent Markovian dephasing; fixed interrogation time')
