#!/bin/bash -l
#SBATCH -A p200277
#SBATCH --job-name="GOTW"
#SBATCH -p gpu
#SBATCH -q default
#SBATCH -t 48:00:00
#SBATCH -N 1
#SBATCH --ntasks-per-node=4
#SBATCH --cpus-per-task=16
#SBATCH --gpus-per-task=1
#SBATCH --output=gromacs.out
#SBATCH --error=gromacs.err

export OMP_NUM_THREADS=$SLURM_CPUS_PER_TASK
export GMX_ENABLE_DIRECT_GPU_COMM=1

export OMPI_MCA_btl='^uct,ofi'
export OMPI_MCA_pml='ucx'
export OMPI_MCA_mtl='^ofi'

########################
##### PREREQUESITE #####
########################
:
# Before running this script on MeluXina, please ensure you have run the following locally on your laptop first.
# This will require installing Acpype (https://github.com/alanwilter/acpype)

    # acpype -p system.prm7 -x system.rst7
    # mv system.amb2gmx/system_GMX.gro .
    # mv system.amb2gmx/system_GMX.top .
    # rm -r system.amb2gmx

###############################
##### CREATING THE SYSTEM #####
###############################

# Activate the modules that will give GROMACS
#Load Gromacs module
module load env/release/2023.1
module load env/staging/2023.1
module load GROMACS/2023.3-foss-2023a-CUDA-12.2.0

# Making an index file
srun gmx_mpi make_ndx -f system_GMX.gro -o system_GMX.ndx<<EOF
rWAT
0 &! rWAT
q
EOF

# Making the box a cuboid
echo 0 | srun gmx_mpi editconf -f system_GMX.gro -bt cubic -d 1 -c -princ -o system_cubic.gro

#################################
##### SIMULATING THE SYSTEM #####
#################################

# Energy minimisation
srun gmx_mpi grompp -f minimisation.mdp -o minimisation.tpr -c system_cubic.gro -p system_GMX.top -n system_GMX.ndx -maxwarn 1
mpirun -np 1 gmx_mpi mdrun -v -deffnm minimisation

# NVT equilibration
srun gmx_mpi grompp -f equilibration_nvt.mdp -o equilibration_nvt.tpr -c minimisation.gro -p system_GMX.top -n system_GMX.ndx
mpirun -np 1 gmx_mpi mdrun -v -deffnm equilibration_nvt 

# NPT equilibration
srun gmx_mpi grompp -f equilibration_npt.mdp -o equilibration_npt.tpr -c equilibration_nvt.gro -t equilibration_nvt.cpt -p system_GMX.top -n system_GMX.ndx
mpirun -np 1 gmx_mpi mdrun -v -deffnm equilibration_npt 

# Production run
srun gmx_mpi grompp -f production.mdp -o production.tpr -c equilibration_npt.gro -t equilibration_npt.cpt -p system_GMX.top -n system_GMX.ndx
mpirun -np 1 gmx_mpi mdrun -v -deffnm production 

# Making a PDB version of the final GRO file for use with CPPTRAJ later
srun gmx_mpi editconf -f production.gro -o production.pdb

# PBC wrapping the trajectory so that all molecules are whole
srun gmx trjconv -s production.tpr -f production.xtc -o production_PBC.xtc -pbc whole<<EOF
0
EOF


#################################
##### PROCESSING THE SYSTEM #####
#################################


# Activate the modules that will give AmberTools
# module rm gromacs/2023/intel/intel
# module load ambertools/20.0

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

