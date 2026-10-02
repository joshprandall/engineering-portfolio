"""Optional real MPI collective example: mpiexec -n 4 python mpi_sum.py."""
from mpi4py import MPI

comm=MPI.COMM_WORLD
rank,size=comm.Get_rank(),comm.Get_size()
local=sum(range(rank+1,101,size))
total=comm.allreduce(local,op=MPI.SUM)
assert total==5050
if rank==0: print({'ranks':size,'sum':total,'expected':5050})
