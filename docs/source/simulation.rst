Free Glycan Simulation Protocol
===============================

The free glycan simulation protocol involves the following steps:

1. Construction of Simulation Systems:
    - The Carbohydrate Builder tool of GLYCAM Web is used to construct the glycan systems.
    - Glycans with one likely conformer are simulated in triplicate for 500 ns each.
    - Glycans with two likely conformers are simulated in duplicate for 500 ns each.
    - Glycans with three or more likely conformers are simulated once for 500 ns each.

2. System Construction:
    - The tleap module of AmberTools is used to construct the simulation systems.
    - The systems are solvated in a water box with a minimum distance of 12 Å to 15 Å.
    - Ions are added to neutralize any system charges to a total concentration of 150 mM to 200 mM NaCl.
    - The GLYCAM06j-1 force field is used to model glycans.
    - The TIP3P water model is used to model solvent molecules.
    - For glycans with modifications not present in the GLYCAM06j-1 force field, the GAFF2 force field is used.

3. Simulation Conduct:
    - Simulations are conducted using either AMBER 18 or GROMACS 2022.4.
    - For AMBER simulations, the system energy is minimized using the steepest descent algorithm.
    - The system is equilibrated in the NVT ensemble and gradually heated from 0 to 100 K, then from 100 K to 300 K.
    - The system is equilibrated in the NPT ensemble to maintain the pressure at 1 bar.
    - Langevin dynamics and isotropic position scaling are used to maintain temperature and pressure, respectively.
    - Periodic boundary conditions are applied, and Van der Waals interactions are truncated at 11 Å.
    - PME is used for long-range electrostatics, and the SHAKE algorithm is used to constrain hydrogen bonds.

    - For GROMACS simulations, the prm7 and rst7 files are converted to GROMACS-readable top and gro files using ACPYPE.
    - The system energy is minimized using the steepest descent algorithm.
    - The system is equilibrated in the NVT ensemble at 300 K and then in the NPT ensemble to maintain the pressure at 1 bar.
    - Langevin dynamics and anisotropic position scaling are used to maintain temperature and pressure, respectively.
    - Periodic boundary conditions are applied, and Van der Waals interactions are truncated at 11 Å.
    - PME is used for long-range electrostatics, and the LINCS algorithm is used to constrain hydrogen bonds.
