Feature: Automatische Axiale Codering
  Als onderzoeker
  Wil ik mijn beoordelingen met één klik omzetten in axial codes
  Zodat ik direct inzicht krijg in overkoepelende patronen zonder handmatig werk

  Scenario Outline: Succesvolle automatische axiale codering met transparantie
    Given ik ben op de tracelijst pagina van "<traceListId>" in project "<projectId>"
    And ik zie een trace-lijst
    And de lijst is volledig ingevuld
    When ik op de genereer knop klik
    Then is de genereer knop uitgeschakeld
    And ik zie een laad-indicator
    When geeft de laadindicator succes aan
    And ik naar de axial-codes pagina navigeer van "<traceListId>" in project "<projectId>"
    Then zie ik een lijst van codes en zie ik per axial code:
      | title  |
      | amount |
    Examples:
      | traceListId | projectId |
      | ceb64d96-fb43-4686-957f-d6d96b53ff6b | 62d22f00-76ae-47c7-b9df-7df35d7bfb2f |

  Scenario Outline: Poging tot conversie niet volledig ingevulde trace-lijst
    Given ik ben op de tracelijst pagina van "<traceListId>" in project "<projectId>"
    And de lijst is niet volledig ingevuld
    Then is de genereer knop uitgeschakeld
    Examples:
      | traceListId | projectId |
      | 6d0772d9-1150-4215-a480-b87feb008107 | aa87ce24-e1f4-4bd3-83a6-58b5fab8869d |

  Scenario Outline: Poging tot conversie gaat fout
    Given ik ben op de tracelijst pagina van "<traceListId>" in project "<projectId>"
    And de lijst is volledig ingevuld
    When ik op de genereer knop klik
    Then is de genereer knop uitgeschakeld
    And ik zie een laad-indicator
    When de laad-indicator error aangeeft
    And ik naar de axial-codes pagina navigeer van "<traceListId>" in project "<projectId>"
    Then zie ik geen axial-codes
    Examples:
      | traceListId | projectId |
      | 73759eab-c37a-45ee-8189-6e37d60feda9 | e2bbb0b2-bd05-43c3-9f28-ae52183da0e3 |
