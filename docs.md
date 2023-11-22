# GlycoShape: A database and toolbox for structural glycomics

##### Callum M. Ives*, Ojas Singh*, Silvia D’Andrea, Carl A. Fogarty, Aoife M. Harbison, Akash Satheesan, Beatrice Tropea, Elisa Fadda
###### Department of Chemistry and Hamilton Institute, Maynooth University, Maynooth, Ireland
###### email: elisa.fadda@mu.ie *These authors contributed equally.


## Introduction
As part of GlycoShape, we have developed three main codebase:
- GlycanAnalysisPipeline
- Re-Glyco
- GlycoShape Website



In this document, we gonna explore the idea behind the choice of the algorythms.

## Glycan Analysis Pipeine

## Re-Glyco


The energy landscape of glycoprotein conformation space is notoriously complex, often characterized by many local minima separated by energy barriers. This landscape can be visualized as rugged, with numerous local optima corresponding to different conformations of the attached glycan and the protein. To build biologically relevant structures, we need to reduce the plausible search space before seeking the optimal structure. We use molecular dynamics (MD) simulations to find energetically favorable configurations (torsion angles $\phi$ and $\psi$ of glycosidic bonds between protein residues and glycans) and representative conformations of the glycan from the GlycoShape Database. This refines the problem to optimize involved variables ( $\phi$, $\psi$ and Glycan conformation) described by the loss function (steric hindrance).

We have developed a tool named "Re-Glyco" for creating realistic glycoproteins. At its core, Re-Glyco utilizes a Genetic Algorithm to optimize the angles $\phi$ and $\psi$ for a given protein structure, denoted as $P$, and a glycan conformation, represented as $G$, within a landscape defined by the loss function $F(P, G, \phi, \psi)$.
Genetic Algorithms (GAs) are particularly effective in navigating such complex landscapes, as they are adept at avoiding the pitfalls of local minima. Through crossover and mutation processes, GAs are capable of extensively exploring the search space and overcoming local optima. The diverse population within GAs facilitates simultaneous exploration of multiple landscape regions.

Re-Glyco, begins with the major cluster (cluster0) and seeks $\phi$ and $\psi$ angles within permissible ranges, derived from MD simulations or crystal structures. The goal is to minimize steric hindrance, defined by a specific loss function, over a population of 128 and across 8 generations for each glycan conformation. If steric clashes persist, Re-Glyco shifts to the second-best major conformation from the GlycoShape database and so on. If no conformation fits the protein site, Re-Glyco tests the least steric glycan conformation, repeating the process (up to 40 times) with adjustments ("wiggles") involving random $10^o$ rotamer changes.

At the conclusion, clash results are reported. This rigorous process can confidently determine whether a specific protein structure can accommodate a particular glycan, providing fascinating insights for various applications. Leveraging these fitting outcomes, we have formulated a technique known as "GlcNAc scanning". Which confidently predicts *N-Glycosylation* based on the protein's 3D structure, utilizing the insights gained from the fit results of Re-Glyco.



### GlcNAc Scanning



## GlycoShape Website

