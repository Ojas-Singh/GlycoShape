import React, { useEffect, useState } from 'react';
import {
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Text,
  Link,
} from '@chakra-ui/react';

interface Tissue {
  taxon_id: string;
  taxon_label: string;
  tissue_label: string;
  doi: string;
}

interface Taxonomy {
  taxon_id: string;
  taxon_label: string;
  rank: string;
  evidence: string[];
}

interface Reference {
  id: string;
  reference_title: string;
  authors: string;
  journal: string;
  year: string;
}

interface CoreProtein {
  id: string;
  protein_name: string;
  protein_accession: string;
  description?: string;
}

interface GlycanDetailsProps {
  glytoucan: string;
}

const GlycanDetails: React.FC<GlycanDetailsProps> = ({ glytoucan }) => {
  const [tissues, setTissues] = useState<Tissue[]>([]);
  const [taxonomy, setTaxonomy] = useState<Taxonomy[]>([]);
  const [references, setReferences] = useState<Reference[]>([]);
  const [coreProteins, setCoreProteins] = useState<CoreProtein[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const tissueRes = await fetch(
        `https://api.alpha.glycosmos.org/sparqlist/get_glycan_tissue?id=${glytoucan}`
      );
      const taxonomyRes = await fetch(
        `https://api.alpha.glycosmos.org/sparqlist/get_glycan_taxonomy?id=${glytoucan}`
      );
      const referenceRes = await fetch(
        `https://api.alpha.glycosmos.org/sparqlist/get_glycan_reference?id=${glytoucan}`
      );
      const coreProteinRes = await fetch(
        `https://api.alpha.glycosmos.org/sparqlist/get_glycan_coreprotein?id=${glytoucan}`
      );

      setTissues(await tissueRes.json());
      setTaxonomy(await taxonomyRes.json());
      setReferences(await referenceRes.json());
      setCoreProteins(await coreProteinRes.json());
    } catch (error) {
      console.error('Error fetching glycan details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [glytoucan]);

  return (
    <Box p={4}>
      <Text mb={4} size="md" fontFamily={'texts'}>
        {glytoucan}
      </Text>
      {loading ? (
        <Spinner size="xl" />
      ) : (
        <Tabs isFitted colorScheme='green'>
          <TabList mb={2}>
            <Tab>Taxonomy</Tab>
            <Tab>Tissues</Tab>
            <Tab>Core Proteins</Tab>
            <Tab>References</Tab>
          </TabList>
          <TabPanels>

            {/* Taxonomy */}
            <TabPanel>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>ID</Th>
                    <Th>Label</Th>
                    <Th>Rank</Th>
                    <Th>Evidence</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {taxonomy.map((tax) => (
                    <Tr key={tax.taxon_id}>
                      <Td>{tax.taxon_id}</Td>
                      <Td>{tax.taxon_label}</Td>
                      <Td>{tax.rank}</Td>
                      <Td>{tax.evidence.join(', ')}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TabPanel>

            {/* Tissues */}
            <TabPanel>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Taxon ID</Th>
                    <Th>Taxon Label</Th>
                    <Th>Tissue Label</Th>
                    <Th>DOI</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {tissues.map((tissue) => (
                    <Tr key={`${tissue.taxon_id}-${tissue.tissue_label}`}>
                      <Td>{tissue.taxon_id}</Td>
                      <Td>{tissue.taxon_label}</Td>
                      <Td>{tissue.tissue_label}</Td>
                      <Td>
                        <Link href={`https://doi.org/${tissue.doi}`} isExternal color="blue.500">
                          {tissue.doi}
                        </Link>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TabPanel>

            {/* Core Proteins */}
            <TabPanel>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Protein Name</Th>
                    <Th>Accession</Th>
                    <Th>Description</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {coreProteins.map((protein) => (
                    <Tr key={protein.id}>
                      <Td>{protein.protein_name}</Td>
                      <Td>
                        <Link
                          href={`https://www.uniprot.org/uniprot/${protein.protein_accession}`}
                          isExternal
                          color="blue.500"
                        >
                          {protein.protein_accession}
                        </Link>
                      </Td>
                      <Td>{protein.description || 'N/A'}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TabPanel>

            {/* References */}
            <TabPanel>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Title</Th>
                    <Th>Authors</Th>
                    <Th>Journal</Th>
                    <Th>Year</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {references.map((ref) => (
                    <Tr key={ref.id}>
                      <Td>{ref.reference_title}</Td>
                      <Td>{ref.authors}</Td>
                      <Td>{ref.journal}</Td>
                      <Td>{ref.year}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}
    </Box>
  );
};

export default GlycanDetails;
