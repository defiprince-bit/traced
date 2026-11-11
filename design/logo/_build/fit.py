import numpy as np
from skimage import measure

def contours(d, S, X0, Y0):
    cs=measure.find_contours(d,0.0)
    out=[]
    for c in cs:
        if len(c)<40: continue
        p=np.stack([c[:,1]/S+X0, c[:,0]/S+Y0],1)
        if np.allclose(p[0],p[-1]): p=p[:-1]
        out.append(p)
    return out

def resample(p, step):
    q=np.vstack([p,p[:1]]); seg=np.hypot(*np.diff(q,axis=0).T); s=np.r_[0,np.cumsum(seg)]
    L=s[-1]; n=max(int(L/step),16); t=np.linspace(0,L,n,endpoint=False)
    return np.stack([np.interp(t,s,q[:,0]),np.interp(t,s,q[:,1])],1)

def csmooth(p, k):
    if k<=0: return p
    n=len(p); idx=np.arange(-k,k+1); w=np.exp(-(idx/(k/2))**2); w/=w.sum()
    return np.stack([np.sum([w[j]*np.roll(p[:,i],-o) for j,o in enumerate(idx)],0) for i in range(2)],1)

def tangents(p):
    t=np.roll(p,-1,0)-np.roll(p,1,0); return t/np.linalg.norm(t,axis=1)[:,None]

def bez(P,t):
    t=t[:,None]; return (1-t)**3*P[0]+3*(1-t)**2*t*P[1]+3*(1-t)*t**2*P[2]+t**3*P[3]

def fit_span(pts, t0, t1):
    # Schneider single-segment fit with fixed unit tangents t0 (out of start) and t1 (into end, pointing back)
    a,b=pts[0],pts[-1]
    d=np.r_[0,np.cumsum(np.hypot(*np.diff(pts,axis=0).T))]; u=d/d[-1]
    for _ in range(4):
        A1=(3*(1-u)**2*u)[:,None]*t0; A2=(3*(1-u)*u**2)[:,None]*t1
        C=np.array([[np.sum(A1*A1),np.sum(A1*A2)],[np.sum(A1*A2),np.sum(A2*A2)]])
        base=bez([a,a,b,b],u); X=np.array([np.sum((pts-base)*A1),np.sum((pts-base)*A2)])
        try: al=np.linalg.solve(C,X)
        except np.linalg.LinAlgError: al=np.array([d[-1]/3]*2)
        seg=np.linalg.norm(b-a)
        if al[0]<1e-3*seg or al[1]<1e-3*seg: al=np.array([seg/3,seg/3])
        P=[a,a+al[0]*t0,b+al[1]*t1,b]
        # reparameterise (one Newton step)
        q=bez(P,u); 
        uu=u[:,None]
        d1=3*((1-uu)**2*(P[1]-P[0])+2*(1-uu)*uu*(P[2]-P[1])+uu**2*(P[3]-P[2]))
        d2=6*((1-uu)*(P[2]-2*P[1]+P[0])+uu*(P[3]-2*P[2]+P[1]))
        num=np.sum((q-pts)*d1,1); den=np.sum(d1*d1,1)+np.sum((q-pts)*d2,1)
        u=np.clip(u-np.where(np.abs(den)>1e-9,num/den,0),0,1); u[0]=0; u[-1]=1; u=np.maximum.accumulate(u)
    err=np.max(np.linalg.norm(bez(P,u)-pts,axis=1))
    return P,err

def fit_closed(p, tol, corners=()):
    n=len(p); T=tangents(p)
    def rec(i,j):
        idx=np.arange(i,j+1)%n; pts=p[idx]
        P,err=fit_span(pts,T[i%n],-T[j%n])
        if err<=tol or j-i<6: return [P]
        m=(i+j)//2
        # split at the point of max error is better; use midpoint for balance
        return rec(i,m)+rec(m,j)
    # initial knots: 8 evenly spaced
    K=8; ks=[int(round(k*n/K)) for k in range(K)]+[n]
    segs=[]
    for a,b in zip(ks[:-1],ks[1:]): segs+=rec(a,b)
    return segs

def path_d(segs_list, f):
    out=[]
    for segs in segs_list:
        out.append('M'+f(segs[0][0]))
        for P in segs: out.append('C'+f(P[1])+' '+f(P[2])+' '+f(P[3]))
        out.append('Z')
    return ''.join(out)
