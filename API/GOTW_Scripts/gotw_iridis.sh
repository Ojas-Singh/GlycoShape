#!/bin/bash -l
#SBATCH --job-name="Job_name"
#SBATCH --partition=batch
#SBATCH --time=2-12:00:00
#SBATCH --nodes=1
#SBATCH --ntasks-per-node=40
#SBATCH --output=gromacs.out
#SBATCH --error=gromacs.err

###############################
##### CREATING THE SYSTEM #####
###############################

# Activate the modules that will give GROMACS
#module load gromacs/2024.0/cuda
module load gromacs/2024.0/intel2024

# Making an index file
srun gmx_mpi make_ndx -f system_GMX.gro -o system_GMX.ndx<<EOF
rWAT
0 &! rWAT
q
EOF

#################################
##### SIMULATING THE SYSTEM #####
#################################

# Energy minimisation
srun gmx_mpi grompp -f minimisation.mdp -o minimisation.tpr -c system_GMX.gro -p system_GMX.top -n system_GMX.ndx -maxwarn 1
mpirun -np 40 gmx_mpi mdrun -v -deffnm minimisation

# NVT equilibration
srun gmx_mpi grompp -f equilibration_nvt.mdp -o equilibration_nvt.tpr -c minimisation.gro -p system_GMX.top -n system_GMX.ndx -maxwarn 1
mpirun -np 40 gmx_mpi mdrun -v -deffnm equilibration_nvt 

# NPT equilibration
srun gmx_mpi grompp -f equilibration_npt.mdp -o equilibration_npt.tpr -c equilibration_nvt.gro -t equilibration_nvt.cpt -p system_GMX.top -n system_GMX.ndx -maxwarn 1
mpirun -np 40 gmx_mpi mdrun -v -deffnm equilibration_npt 

# Production run
srun gmx_mpi grompp -f production.mdp -o production.tpr -c equilibration_npt.gro -t equilibration_npt.cpt -p system_GMX.top -n system_GMX.ndx -maxwarn 1
mpirun -np 40 gmx_mpi mdrun -v -deffnm production

# Making a PDB version of the final GRO file for use with CPPTRAJ later
srun gmx_mpi editconf -f production.gro -o production.pdb


# PBC wrapping the trajectory so that all molecules are whole
srun gmx_mpi trjconv -s production.tpr -f production.xtc -o production_PBC.xtc -pbc whole<<EOF
0
EOF

#################################
##### PROCESSING THE SYSTEM #####
#################################

# Activate the modules that will give AmberTools
module rm gromacs/2024.0/intel2024
module load ambertools/20.0

# Processing of the trajectory:
cpptraj<<EOF
parm production.pdb pdb
trajin production_PBC.xtc 1 last 5
strip :WAT,Na+,Cl-,SOL,NA,CL,NA+,CL-,Ion
autoimage
rms first
trajout glycan.dry.pdb pdb
trajout glycan.dry.mol2 mol2 onlyframes 1
parmwrite out glycan.dry.prm7 prm7
EOF

rm production_PBC.xtc
