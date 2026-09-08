Feature: Overview of traces
  As an assessor
  I want to get a structured overview of traces after creating/uploading a trace list
  So that I have a clear overview and can get started with them.

  Scenario: View list of traces
    Given a project has been selected
    And a tracelist has been selected
    Then display a list with every trace that shows an input preview, assessment status and an indicator whether an open code has been filled for every trace

  Scenario: Select and highlight a trace
    Given a project has been selected
    And a tracelist has been selected
    When an individual trace has been selected
    Then highlight that trace in the tracelist

  Scenario: View empty tracelist
    Given a project has been selected
    And a tracelist has been selected
    When the tracelist is empty
    Then display a text label indicating the list is empty

  Scenario: Tracelist could not be retrieved
    Given a project has been selected
    And a tracelist has been selected
    When the tracelist could not be retrieved
    Then display an error indicating the tracelist could not be retrieved, including the reason why it failed

  Scenario: Hide processed filter
    Given a project has been selected
    And a tracelist has been selected
    When the hide processed filter has been enabled
    Then hide all completed traces from the tracelist

  Scenario: Only show flagged filter
    Given a project has been selected
    And a tracelist has been selected
    When the only show flagged filter has been enabled
    Then only list traces that have been flagged