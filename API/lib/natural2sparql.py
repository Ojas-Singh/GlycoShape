import requests
import json
import os
from typing import Dict, List, Any, Optional, Generator
import openai

class Natural2SPARQL:
    def __init__(self, sparql_endpoint: str = "https://glycoshape.io/sparql/query", 
                 api_key: Optional[str] = None,
                 base_url: str = "https://openrouter.ai/api/v1",
                 model: str = "deepseek/deepseek-chat-v3-0324:free"):
        """
        Initialize the Natural2SPARQL converter.
        
        Args:
            sparql_endpoint: URL of the SPARQL endpoint
            api_key: OpenRouter API key. If not provided, will look for OPENROUTER_API_KEY in env
            base_url: Base URL for the OpenRouter API
            model: Model to use for text generation
        """
        self.sparql_endpoint = sparql_endpoint
        self.api_key = api_key or os.environ.get("OPENROUTER_API_KEY")
        self.base_url = base_url
        self.model = model
        
        if not self.api_key:
            raise ValueError("OpenRouter API key not provided. Set OPENROUTER_API_KEY environment variable or pass api_key.")
        
        self.client = openai.OpenAI(
            base_url=self.base_url,
            api_key=self.api_key
        )
        
        # Common prefixes used in GlycoShape SPARQL queries
        self.default_prefixes = """
PREFIX gs: <http://glycoshape.io/ontology/>
PREFIX gso: <http://glycoshape.io/resource/>
PREFIX glycordf: <http://purl.jp/bio/12/glyco/glycan#>
PREFIX glytoucan: <http://rdf.glytoucan.org/glycan/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
"""

    def _create_system_prompt(self) -> str:
        """Create the system prompt for SPARQL generation."""
        return """
You are an expert in SPARQL. Your task is to convert a natural language query into a valid SPARQL query
for the GlycoShape RDF database.
# System Prompt: GlycoShape SPARQL Query Generator

You are a specialized SPARQL query generator for the GlycoShape RDF database. Your task is to convert natural language queries into valid SPARQL queries. You must respond ONLY with the SPARQL query - no explanations, no additional text, just the query.

## Database Structure Overview

### Core Entity Hierarchy
```
gs:GlycoShapeEntry (main database entry)
├── gs:hasVariant → gs:GlycanVariant (generic variant)
├── gs:hasArchetype → gs:ArchetypeGlycan
├── gs:hasAlphaAnomer → gs:AlphaAnomerGlycan  
└── gs:hasBetaAnomer → gs:BetaAnomerGlycan
```

### Required Namespaces (Always Include)
```sparql
PREFIX gs: <http://glycoshape.io/ontology/>
PREFIX gso: <http://glycoshape.io/resource/>
PREFIX glycordf: <http://purl.jp/bio/12/glyco/glycan#>
PREFIX glytoucan: <http://rdf.glytoucan.org/glycan/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
```

## Entity Types and Properties

### GlycoShapeEntry Properties
- `rdf:type gs:GlycoShapeEntry`
- `rdfs:label` (string) - "GlycoShape Entry {ID}"
- `dcterms:identifier` (string) - main ID
- `gs:glycoShapeID` (string) - main ID
- `gs:hasVariant` → variant URIs
- `gs:hasArchetype` → archetype URI
- `gs:hasAlphaAnomer` → alpha anomer URI
- `gs:hasBetaAnomer` → beta anomer URI

### GlycanVariant Properties (All variant types inherit these)
- `rdf:type gs:GlycanVariant` AND `glycordf:Saccharide`
- `rdf:type` specific: `gs:ArchetypeGlycan`, `gs:AlphaAnomerGlycan`, `gs:BetaAnomerGlycan`

#### Identifiers & Names
- `rdfs:label` (string) - primary name
- `gs:glytoucanID` (string) - GlyTouCan identifier
- `owl:sameAs` → `glytoucan:{ID}` URI
- `dcterms:identifier` (string) - GlyTouCan ID
- `gs:iupacName` (string)
- `gs:iupacExtendedName` (string)
- `gs:glycamName` (string)
- `gs:oxfordName` (string)

#### Physical/Chemical Properties
- `gs:mass` (xsd:double) - molecular mass
- `gs:hydrogenBondAcceptors` (xsd:integer)
- `gs:hydrogenBondDonors` (xsd:integer)
- `gs:rotatableBonds` (xsd:integer)

#### Sequence Representations
- `glycordf:has_glycosequence` → sequence node
  - Sequence node properties:
    - `rdf:type glycordf:Glycosequence`
    - `glycordf:has_sequence` (xsd:string) - actual sequence
    - `glycordf:in_carbohydrate_format` → format URI
    - Format URIs and labels:
      - `glycordf:carbohydrate_format_wurcs` → "WURCS"
      - `glycordf:carbohydrate_format_glycoct` → "GlycoCT"
      - `glycordf:carbohydrate_format_iupac_condensed` → "IUPAC Condensed"
      - `gs:carbohydrate_format_iupac_extended` → "IUPAC Extended"
      - `gs:carbohydrate_format_glycam` → "GLYCAM"
      - `gs:carbohydrate_format_smiles` → "SMILES"

#### Structural Features
- `glycordf:has_motif` → motif URI
  - Motif properties:
    - `rdf:type glycordf:Motif`
    - `dcterms:identifier` (string) - motif ID
    - `rdfs:label` (string) - motif label
- `glycordf:has_terminal_residue` (string) - terminal residue name

#### Composition
- `glycordf:has_component` → component node (BNode)
  - Component properties:
    - `rdf:type glycordf:Component`
    - `glycordf:has_monosaccharide` → monosaccharide type URI
    - `glycordf:has_cardinality` (xsd:integer) - count
  - Monosaccharide type URI: `gso:monosaccharide/{name}`
    - `rdfs:label` (string) - monosaccharide name
- `gs:compositionString` (string) - text composition

#### Simulation Parameters
- `gs:simulationPackage` (string)
- `gs:simulationForcefield` (string)
- `gs:simulationLength` (string)
- `gs:simulationTemperature` (xsd:double)
- `gs:simulationPressure` (xsd:double)
- `gs:simulationSaltConcentration` (string)

#### Simulation Results
- `gs:hasClusterResult` → cluster result node (BNode)
  - Cluster result properties:
    - `rdf:type gs:ClusterResult`
    - `rdfs:label` (string) - cluster label
    - `gs:clusterLabel` (string) - safe cluster label
    - `rdf:value` (xsd:double) - percentage
    - `gs:clusterPercentage` (xsd:double) - percentage

#### Anomer Relationships
- `gs:isAnomerOf` → archetype URI (from alpha/beta to archetype)

## URI Patterns
- Main entries: `gso:{main_id}`
- Variants: `gso:{main_id}/{variant_type}` where variant_type = "archetype"|"alpha"|"beta"
- Motifs: `gso:motif/{motif_id}`
- Monosaccharides: `gso:monosaccharide/{mono_name}`
- Sequences: `gso:{main_id}/{variant_type}/sequence/{format_label}`

## Query Construction Guidelines

### Common Patterns
1. **Find entries**: Start with `?entry rdf:type gs:GlycoShapeEntry`
2. **Find variants**: Use `?entry gs:hasVariant ?variant` or specific type predicates
3. **Access properties**: Most properties are on variant level, not entry level
4. **Filter by type**: Use specific variant types for anomer queries
5. **Numerical filters**: Use appropriate XSD datatypes in FILTER clauses
6. **Text search**: Use CONTAINS(), LCASE(), REGEX() for string matching
7. **Aggregation**: Use GROUP BY, COUNT(), AVG(), MAX(), MIN() for statistics
8. **Optional data**: Use OPTIONAL{} for properties that might not exist

### Default Query Structure
```sparql
PREFIX gs: <http://glycoshape.io/ontology/>
PREFIX gso: <http://glycoshape.io/resource/>
PREFIX glycordf: <http://purl.jp/bio/12/glyco/glycan#>
PREFIX glytoucan: <http://rdf.glytoucan.org/glycan/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX owl: <http://www.w3.org/2002/07/owl#>

SELECT ... WHERE {
    [QUERY PATTERNS]
}
[ORDER BY ...]
[LIMIT ...]
```

## Natural Language to SPARQL Mapping

### Terms to Properties Mapping
- "name", "label" → `rdfs:label`
- "mass", "molecular weight" → `gs:mass`
- "motif" → `glycordf:has_motif`
- "component", "monosaccharide" → `glycordf:has_component`
- "sequence" → `glycordf:has_glycosequence`
- "WURCS", "GlycoCT", "IUPAC", "GLYCAM", "SMILES" → respective format URIs
- "simulation", "forcefield" → `gs:simulationForcefield`
- "temperature" → `gs:simulationTemperature` 
- "cluster" → `gs:hasClusterResult`
- "archetype" → `gs:ArchetypeGlycan`
- "alpha", "α" → `gs:AlphaAnomerGlycan`
- "beta", "β" → `gs:BetaAnomerGlycan`
- "anomer" → both alpha and beta
- "GlyTouCan" → `gs:glytoucanID`
- "terminal" → `glycordf:has_terminal_residue`
- "composition" → `gs:compositionString` or component analysis

### Query Type Recognition
- "list", "show", "find" → SELECT query
- "count", "how many" → SELECT with COUNT()
- "average", "mean" → SELECT with AVG()
- "maximum", "highest" → SELECT with MAX()
- "compare" → SELECT with multiple variants
- "with", "containing", "having" → WHERE clause patterns
- "greater than", "more than", ">" → FILTER with >
- "less than", "<" → FILTER with <
- "between" → FILTER with >= AND <=

### Default Behaviors
- Always include LIMIT 100 unless specified otherwise
- Use ORDER BY for meaningful sorting
- Include OPTIONAL{} for GlyTouCan IDs and other optional properties
- Use DISTINCT when listing unique values
- Apply FILTER as late as possible for performance

Remember: Respond ONLY with the SPARQL query. No explanations, no markdown formatting, just the raw query.
"""

    def generate_sparql(self, search_query: str) -> str:
        """
        Generate a SPARQL query from a natural language query using OpenRouter API.
        If API call fails, return a default test query.
        
        Args:
            search_query: Natural language search query
            
        Returns:
            SPARQL query string
        """
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self._create_system_prompt()},
                    {"role": "user", "content": f"Natural language query: {search_query}\n\nGenerate a SPARQL query using these prefixes:\n{self.default_prefixes}"}
                ],
                max_tokens=1000,
                temperature=0.1
            )
            
            sparql_query = response.choices[0].message.content.strip()
            
        except Exception as e:
            print(f"OpenRouter API call failed: {e}. Falling back to default query.")
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

        # Add default prefixes if the generated query doesn't include them
        if not sparql_query.strip().lower().startswith("prefix"):
            sparql_query = self.default_prefixes + "\n" + sparql_query

        return sparql_query.strip()

    def natural_to_sparql_stream(self, search_query: str, endpoint: str = "") -> Generator[str, None, None]:
        """
        Generate a SPARQL query from a natural language query using streaming response.
        
        Args:
            search_query: Natural language search query
            endpoint: SPARQL endpoint (optional, for context)
            
        Yields:
            Tokens of the SPARQL query as they are generated
        """
        try:
            stream = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self._create_system_prompt()},
                    {"role": "user", "content": f"Natural language query: {search_query}\n\n"}
                ],
                max_tokens=1000,
                temperature=0.1,
                stream=True
            )
            
            # Track if we need to add prefixes
            first_token = True
            content_so_far = ""
            
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    token = chunk.choices[0].delta.content
                    content_so_far += token
                    
                    # # If this is the first meaningful token and doesn't start with PREFIX, add prefixes
                    # if first_token and token.strip():
                    #     if not content_so_far.strip().lower().startswith("prefix"):
                    #         # Yield the prefixes first
                    #         for prefix_line in self.default_prefixes.strip().split('\n'):
                    #             if prefix_line.strip():
                    #                 yield prefix_line + '\n'
                    #         yield '\n'
                    #     first_token = False
                    
                    yield token
                    
        except Exception as e:
            print(f"OpenRouter streaming API call failed: {e}. Falling back to default query.")
            # Fallback - yield the default query token by token
            fallback_query = """
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
            # Yield the fallback query character by character to simulate streaming
            for char in fallback_query:
                yield char

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
                'mass': float(item.get('mass')) if item.get('mass') is not None else None            # Map from SPARQL variable name
            }
            # Ensure all required keys are present, even if None
            if entry['glytoucan'] is not None and entry['ID'] is not None and entry['mass'] is not None:
                 formatted_results.append(entry)

        print(f"Formatted results: {json.dumps(formatted_results, indent=2)}")  # Debugging output
        return formatted_results