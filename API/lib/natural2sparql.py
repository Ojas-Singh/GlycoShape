import requests
import json
import os
from typing import Dict, List, Any, Optional
import anthropic

class Natural2SPARQL:
    def __init__(self, sparql_endpoint: str = "https://glycoshape.io/sparql/query", 
                 api_key: Optional[str] = None):
        """
        Initialize the Natural2SPARQL converter.
        
        Args:
            sparql_endpoint: URL of the SPARQL endpoint
            api_key: Anthropic API key for Claude. If not provided, will look for ANTHROPIC_API_KEY in env
        """
        self.sparql_endpoint = sparql_endpoint
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        
        if not self.api_key:
            raise ValueError("Anthropic API key not provided. Set ANTHROPIC_API_KEY environment variable or pass api_key.")
        
        self.client = anthropic.Anthropic(api_key=self.api_key)
        
        # Common prefixes used in GlycoShape SPARQL queries
        self.default_prefixes = """
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX gs: <http://glycoshape.io/ontology/>
PREFIX gso: <http://glycoshape.io/resource/>
PREFIX glycordf: <http://purl.jp/bio/12/glyco/glycan#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
"""

    def generate_sparql(self, search_query: str) -> str:
        """
        Generate a SPARQL query from a natural language query using Claude.
        If Claude fails, return a default test query.
        
        Args:
            search_query: Natural language search query
            
        Returns:
            SPARQL query string
        """
#         prompt = f"""
# You are an expert in SPARQL and glycobiology. Your task is to convert a natural language query into a valid SPARQL query 
# for the GlycoShape database.

# Common entity types and properties in the GlycoShape database:
# - gs:ArchetypeGlycan - Main glycan entities
# - gs:glytoucanID - GlyTouCan identifiers (string)
# - gs:ID - GlycoShape internal ID (integer)
# - gs:mass - Molecular mass (float)
# - glycordf:has_glycosequence - Links to sequence information
# - glycordf:has_sequence - The actual sequence string
# - glycordf:in_carbohydrate_format - Format specification (like IUPAC)

# You must always include these essential variable bindings in the SELECT clause:
# - ?glycan - The glycan entity URI
# - ?glytoucan_id - The GlyTouCan ID (bound using gs:glytoucanID)
# - ?id - The GlycoShape internal ID (bound using gs:ID)
# - ?mass - The molecular mass (bound using gs:mass)

# Natural language query: {search_query}

# Please generate a valid SPARQL query using the given prefixes:
# {self.default_prefixes}

# Return only the SPARQL query with no additional explanations. Make sure to bind ?glycan to gs:ArchetypeGlycan entities.
# """
        
        prompt = f"""
You are an expert in SPARQL and glycobiology. Your task is to convert a natural language query into a valid SPARQL query
for the GlycoShape RDF database.

## GlycoShape Database Structure
The GlycoShape database contains detailed information about glycans with the following key entity types:
- gs:GlycoShapeEntry - Main entries that contain variants
- gs:GlycanVariant - Base type for all glycan variants
- gs:ArchetypeGlycan - Generic/base form of glycans
- gs:AlphaAnomerGlycan - Alpha anomer variants of glycans
- gs:BetaAnomerGlycan - Beta anomer variants of glycans
- glycordf:Saccharide - All variants are also of type Saccharide
- glycordf:Motif - Structural motifs found in glycans
- glycordf:Component - Monosaccharide components of glycans
- gs:ClusterResult - Simulation cluster analysis results

## Key Identifiers and Names
- gs:glycoShapeID - GlycoShape internal ID (string)
- gs:glytoucanID - GlyTouCan identifiers (string)
- dcterms:identifier - Alternative identifier field
- rdfs:label - Human-readable name/label
- gs:iupacName - IUPAC nomenclature name
- gs:iupacExtendedName - Extended IUPAC name
- gs:glycamName - GLYCAM naming format
- gs:oxfordName - Oxford nomenclature

## Sequence Representations
- glycordf:has_glycosequence - Links to sequence information nodes
- glycordf:has_sequence - The actual sequence string
- glycordf:in_carbohydrate_format - Format specification (including):
  - glycordf:carbohydrate_format_wurcs - WURCS format
  - glycordf:carbohydrate_format_glycoct - GlycoCT format
  - glycordf:carbohydrate_format_iupac_condensed - IUPAC Condensed format
  - gs:carbohydrate_format_iupac_extended - IUPAC Extended format
  - gs:carbohydrate_format_glycam - GLYCAM format
  - gs:carbohydrate_format_smiles - SMILES format

## Physical/Chemical Properties
- gs:mass - Molecular mass (float)
- gs:hydrogenBondAcceptors - Number of H-bond acceptors (integer)
- gs:hydrogenBondDonors - Number of H-bond donors (integer)
- gs:rotatableBonds - Number of rotatable bonds (integer)

## Structural Features
- glycordf:has_motif - Links to motifs present in the glycan
- glycordf:has_terminal_residue - Terminal residues in the glycan
- glycordf:has_component - Links to component monosaccharides
- glycordf:has_monosaccharide - Type of monosaccharide in a component
- glycordf:has_cardinality - Count of a monosaccharide component
- gs:compositionString - Text representation of composition

## Simulation Data
- gs:simulationPackage - Software package used for simulation
- gs:simulationForcefield - Force field used in simulation
- gs:simulationLength - Length of simulation
- gs:simulationTemperature - Temperature of simulation (double)
- gs:simulationPressure - Pressure of simulation (double)
- gs:simulationSaltConcentration - Salt concentration used
- gs:hasClusterResult - Links to clustering results
- gs:clusterLabel - Label of a conformational cluster
- gs:clusterPercentage - Percentage of the cluster (double)

## Relationships
- gs:hasVariant - Links main entry to its variants
- gs:hasArchetype - Links main entry to its archetype variant
- gs:hasAlphaAnomer - Links main entry to its alpha anomer variant
- gs:hasBetaAnomer - Links main entry to its beta anomer variant
- gs:isAnomerOf - Links alpha/beta variants to their archetype

Natural language query: {search_query}

Please generate a valid SPARQL query using the given prefixes:
{self.default_prefixes}

For optimal results:
1. Include any relevant entity types and properties from the above list based on the query
2. When searching for glycans, use both specific variant types and the base GlycanVariant type as appropriate
3. Include FILTER clauses for numeric or string pattern matching when needed
4. Use OPTIONAL clauses for properties that might not exist in all entities
5. Always include these essential bindings in the SELECT clause:
   - ?glytoucan_id - The GlyTouCan ID (bound using gs:glytoucanID)
   - ?id - The GlycoShape internal ID (bound using gs:ID)
   - ?mass - The molecular mass (bound using gs:mass)

Return only the SPARQL query with no additional explanations.
"""
        try:
            response = self.client.messages.create(
                model="claude-3-7-sonnet-20250219",
                max_tokens=1000,
                temperature=0.1,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            # Extract the SPARQL query from the response
            sparql_query = response.content[0].text.strip()
        except Exception as e:
            print(f"Anthropic API call failed: {e}. Falling back to default query.")
            # Fallback SPARQL query
            sparql_query = """
PREFIX gs: <http://glycoshape.io/ontology/>
PREFIX gso: <http://glycoshape.io/resource/>
PREFIX glycordf: <http://purl.jp/bio/12/glyco/glycan#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

SELECT ?id ?glytoucan ?mass
WHERE {
  # Get the main entry ID
  ?entry rdf:type gs:GlycoShapeEntry ;
         gs:glycoShapeID ?id ;
         gs:hasArchetype ?archetype .
  
  # Get the archetype variant with its sequence
  ?archetype rdf:type gs:ArchetypeGlycan ;
             gs:mass ?mass .
           
  # Optional GlyTouCan ID
  OPTIONAL { ?archetype gs:glytoucanID ?glytoucan }
  
  # Get the IUPAC sequence
  ?archetype glycordf:has_glycosequence ?seq .
  ?seq glycordf:in_carbohydrate_format glycordf:carbohydrate_format_iupac_condensed ;
       glycordf:has_sequence ?iupac .
  
  # Filter for sequences ending with Man(b1-4)GlcNAc(b1-4)GlcNAc
  FILTER(STRENDS(?iupac, "Man(b1-4)GlcNAc(b1-4)GlcNAc"))
}
ORDER BY ?id
"""
            # Ensure the fallback query includes prefixes
            if not sparql_query.strip().lower().startswith("prefix"):
                 # The fallback query already includes prefixes, but this ensures consistency
                 # In this specific case, the fallback already has them, so this might be redundant
                 # but good practice if the fallback could change.
                 pass # Prefixes are included in the fallback string
            else:
                 # Remove existing prefixes if they somehow got added before the fallback
                 # This scenario is unlikely with the current fallback structure
                 lines = sparql_query.strip().split('\n')
                 sparql_query = "\n".join(line for line in lines if not line.strip().lower().startswith("prefix"))


        # Add default prefixes if the generated query (from Claude) doesn't include them
        # This check is primarily for the successful Claude response case
        if not sparql_query.strip().lower().startswith("prefix"):
            sparql_query = self.default_prefixes + "\n" + sparql_query
        
        

        return sparql_query.strip() # Return stripped query

    def execute_sparql(self, sparql_query: str) -> List[Dict[str, Any]]:
        """
        Execute a SPARQL query against the endpoint.
        
        Args:
            sparql_query: SPARQL query string
            
        Returns:
            List of result bindings
        """
        headers = {
            "Accept": "application/sparql-results+json",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        
        params = {
            "query": sparql_query
        }
        print(f"Executing SPARQL query: {sparql_query}")  # Debugging output
        response = requests.post(self.sparql_endpoint, headers=headers, data=params)
        
        if response.status_code != 200:
            raise Exception(f"SPARQL query failed with status code {response.status_code}: {response.text}")
        
        results = response.json()
        print(f"SPARQL query executed successfully. Status code: {response.status_code}")
        print(f"Response: {json.dumps(results, indent=2)}")  # Debugging output
        # Convert the results to a more usable format
        bindings = []
        if "results" in results and "bindings" in results["results"]:
            for binding in results["results"]["bindings"]:
                binding_dict = {}
                for var_name, var_value in binding.items():
                    # Extract value and handle potential type conversion for mass and ID
                    value = var_value["value"]
                    if var_name == 'mass' and var_value.get('datatype') == 'http://www.w3.org/2001/XMLSchema#float':
                        try:
                            value = float(value)
                        except ValueError:
                            pass # Keep as string if conversion fails
                    elif var_name == 'id' and var_value.get('datatype') == 'http://www.w3.org/2001/XMLSchema#integer':
                        try:
                            value = int(value)
                        except ValueError:
                            pass # Keep as string if conversion fails
                    binding_dict[var_name] = value
                bindings.append(binding_dict)
        print(f"Parsed {len(bindings)} bindings from the response.")  # Debugging output
        print(f"Bindings: {json.dumps(bindings, indent=2)}")  # Debugging output
        return bindings

    def search(self, query: str) -> List[Dict[str, Any]]:
        """
        Search the GlycoShape database using natural language.
        
        Args:
            query: Natural language query
            
        Returns:
            List of glycan results formatted as {'glytoucan': ..., 'ID': ..., 'mass': ...}
        """
        sparql_query = self.generate_sparql(query)
        raw_results = self.execute_sparql(sparql_query)
        
        # Transform results into the desired format
        formatted_results = []
        for item in raw_results:
            entry = {
                'glytoucan': item.get('glytoucan'), # Map from SPARQL variable name
                'ID': item.get('id'),             # Map from SPARQL variable name
                'mass': float(item.get('mass'))            # Map from SPARQL variable name
            }
            # Ensure all required keys are present, even if None
            if entry['glytoucan'] is not None and entry['ID'] is not None and entry['mass'] is not None:
                 formatted_results.append(entry)

        
        # formatted_results.sort(key=lambda x: x['mass'] if x['mass'] is not None else float('inf'))
        print(f"Formatted results: {json.dumps(formatted_results, indent=2)}")  # Debugging output
        return formatted_results