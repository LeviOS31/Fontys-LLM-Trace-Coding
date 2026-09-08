Feature: Detailed trace reviewing and evaluation
  As a reviewer, I want to be able to see a detailed view of a trace, so that I can take more context into account in my evaluation.

  Scenario Outline: Viewing trace details
    Given The trace has context
    When I click on the "Detailed" button
    Then I see the detailed view of the trace including the context

  Scenario Outline: Open tree view
    Given The trace has children
    When I click on the "Detailed" button
    Then The tree view is opened
    And I see the children of the trace in the tree view

  Scenario Outline: Viewing other trace
    Given There are other parents or children of the current trace in the tree view
    When I click on a trace in the tree view that is not the current trace
    Then The information of the clicked trace is displayed
    And The reviewing interface is hidden
  
  Scenario Outline: Returning to simple view
    Given I am in the detailed view of a trace
    When I click on the "Simple" button
    Then I am directed back to the simple view of the trace