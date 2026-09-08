Feature: Overview of trace lists in a project
  As a user
  I want to see all associated trace lists in a project overview
  So that I have a clear overview and can get started with them.

  Scenario: View list of trace lists
    Given a project has been selected
    Then display a list of trace lists showing the title, creation date, and completion status for each trace list

  Scenario: Navigate to trace list
    Given a project has been selected
    When a trace list is selected
    Then navigate to that trace list

  Scenario: Filter on completed
    Given a project has been selected
    When the user filters on completed
    Then display only completed trace lists

  Scenario: Filter on not completed
    Given a project has been selected
    When the user filters on not completed
    Then display only trace lists that are not completed

  Scenario: Search by name
    Given a project has been selected
    When the user enters a search term in the search bar
    Then display only trace lists where the title matches the search term

  Scenario: Project without trace lists
    Given a project has been selected
    When the project has no trace lists
    Then display a text label indicating no trace lists are available

  Scenario: Trace lists could not be retrieved
    Given a project has been selected
    When the trace lists could not be retrieved
    Then display an error indicating the trace lists could not be retrieved, including the reason why it failed