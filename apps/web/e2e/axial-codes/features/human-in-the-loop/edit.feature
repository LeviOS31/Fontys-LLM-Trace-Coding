Feature: Human-in-the-loop aanpassen van Axiale Codes
  Als onderzoeker
  Wil ik gegenereerde axial codes kunnen aanpassen
  Zodat ik de analyse kan verfijnen op basis van mijn expertise

  Scenario Outline: Succesvol aanpassen van een axial code naam en beschrijving
    Given het systeem heeft axial codes en redenaties gegenereerd voor "<traceListId>" in project "<projectId>"
    And ik bekijk het resultatenoverzicht
    When ik een gegenereerde axial code of beschrijving wil wijzigen
    Then moet ik duidelijk zien dat dit aanpasbaar is
    And ik op de titel of beschrijving klik kan ik de tekst aanpassen
    And moeten de wijzigingen direct worden opgeslagen in de analyse
    Examples:
      | traceListId                          | projectId                            |
      | b4f199fd-d64d-4843-bced-0d86117bda97 | 594abe1e-669f-46c5-b8e0-193f5797d2ee |

  Scenario Outline: Axial code opslaan met lege naam of beschrijving
    Given het systeem heeft axial codes en redenaties gegenereerd voor "<traceListId>" in project "<projectId>"
    And ik bekijk het resultatenoverzicht
    When ik een axial code een lege naam of beschrijving geef
    Then geeft het systeem een melding dat de gebruiker wat in moet vullen
    Examples:
      | traceListId                          | projectId                            |
      | b4f199fd-d64d-4843-bced-0d86117bda97 | 594abe1e-669f-46c5-b8e0-193f5797d2ee |
