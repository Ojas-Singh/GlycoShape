import requests
import json
import os
from typing import Dict, List, Any, Optional
import anthropic

class Natural2SPARQL:
    def __init__(self, sparql_endpoint: str = "https://glycoshape.io/sparql/", 
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
        
        Args:
            search_query: Natural language search query
            
        Returns:
            SPARQL query string
        """
        prompt = f"""
You are an expert in SPARQL and glycobiology. Your task is to convert a natural language query into a valid SPARQL query 
for the GlycoShape database.

Common entity types and properties in the GlycoShape database:
- gs:ArchetypeGlycan - Main glycan entities
- gs:glytoucanID - GlyTouCan identifiers (string)
- gs:ID - GlycoShape internal ID (integer)
- gs:mass - Molecular mass (float)
- glycordf:has_glycosequence - Links to sequence information
- glycordf:has_sequence - The actual sequence string
- glycordf:in_carbohydrate_format - Format specification (like IUPAC)

You must always include these essential variable bindings in the SELECT clause:
- ?glycan - The glycan entity URI
- ?glytoucan_id - The GlyTouCan ID (bound using gs:glytoucanID)
- ?id - The GlycoShape internal ID (bound using gs:ID)
- ?mass - The molecular mass (bound using gs:mass)

Natural language query: {search_query}

Please generate a valid SPARQL query using the given prefixes:
{self.default_prefixes}

Return only the SPARQL query with no additional explanations. Make sure to bind ?glycan to gs:ArchetypeGlycan entities.
"""
        
        response = self.client.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=1000,
            temperature=0.1,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        # Extract the SPARQL query from the response
        sparql_query = response.content[0].text.strip()
        
        # Add prefixes if not included
        if not sparql_query.lower().startswith("prefix"):
            sparql_query = self.default_prefixes + "\n" + sparql_query
            
        return sparql_query

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
        
        response = requests.post(self.sparql_endpoint, headers=headers, data=params)
        
        if response.status_code != 200:
            raise Exception(f"SPARQL query failed with status code {response.status_code}: {response.text}")
        
        results = response.json()
        
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
                'glytoucan': item.get('glytoucan_id'), # Map from SPARQL variable name
                'ID': item.get('id'),             # Map from SPARQL variable name
                'mass': item.get('mass')            # Map from SPARQL variable name
            }
            # Ensure all required keys are present, even if None
            if entry['glytoucan'] is not None and entry['ID'] is not None and entry['mass'] is not None:
                 formatted_results.append(entry)

        
        # formatted_results.sort(key=lambda x: x['mass'] if x['mass'] is not None else float('inf'))
        
        return formatted_results