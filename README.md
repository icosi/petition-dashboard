# Petition Dashboard

A React-based analytics dashboard for visualizing petition signature data with interactive charts, filters, and key performance indicators.

## How to Run

- `git clone https://github.com/icosi/petition-dashboard` and enter project folder
- `npm install` to download dependencies
- `npm run dev` to run app
- Go to `http://localhost:3000` to view the dashboard

## Approach and Code Structure

### Architecture Overview
The dashboard is built as a single-page React application using functional components with hooks. The main component (`App.jsx`) handles all state management, data aggregation, and rendering.

**Key Design Decisions:**

1. **Centralized State Management** - All application state (filters, UI state) is managed in the main App component using `useState`. This provides a clear data flow from state → computation → rendering.

2. **Computed Data Layers** - Data flows through multiple `useMemo` hooks that progressively aggregate and filter the base dataset:
   - `signaturesWithCountry` - Enriches raw data with country names
   - `chartSignatures` - Applies all filters (country, source, date range)
   - `signaturesByDateAndSource` - Aggregates to daily totals by source
   - `dailyBySource` - Generates complete date range with zeros for missing dates
   - Multiple KPI calculations (by source, weekday, country)

3. **Responsive Component Structure** - The dashboard is divided into five main sections:
   - Petition details card
   - Filters panel
   - Collapsible daily signatures chart (Recharts BarChart)
   - Collapsible analytics/KPI section (four cards with tables)
   - Collapsible data table with raw records

4. **Declarative UI with Recharts** - Uses Recharts library for visualization with stacked bar charts, custom tooltips, and responsive containers.


## Trade-offs / Improvements With More Time

1. **Server-Side Data Processing and API**: Moving the data processing to a backend API would allow for more efficient filtering, aggregation, and analysis. The client could then make requests to the API, which would return only the relevant data based on the selected filters. This would be especially important for very large datasets, where client-side filtering could become slow or resource-heavy.
2. **Component Decomposition**: Extract components into separate files for maintainability
3. **Error Handling**: Add try-catch for data loading failures and display user-friendly error messages
4. **Customization of style**: Hardcoded source colors, could load from configuration file
5. **More ways to interpret the data**: More filters, more KPI, more data

## How AI Tools Were Used

**GitHub Copilot for Code Generation**: This app was created using the following prompts
- create empty react project
- there is a file on root that is called 'petition_signatures.json'. Take that data and display it in a table on the main page
- use the library recharts to create a data visualization, then we will add ways to filter
- the json with the data has 'petition', 'signatures' and 'countries' fields. From 'petition' show all data except the 'id'. Aggregate the data from 'countries' into the data from 'signatures'
- you can delete the country code field from the final table. Also, do the sumatory of all the signatures and add that number the goal field on the petition details. Let's also add filters
- update the visual dashboard called daily signatures. Instead of a line, use columns. The color of the column will diferentiate the source of the signautures
    - all signatures on a same day should unified in a single column. This column will have the sumatory of the diferent sources stack on top of each other
    - when i move the mouse over a column i see the data. Add a 'total' sumatory there
    - when i filter by country the column chart updates the view with that filter but doesn't do it when i filter by source. Update this so it does 
    - if i filter by country and source there are days that have 0 data and the chart doesn't display these days. The behaviour should be that all days from the first to the last should be displayed, if a day doesn't have any data there should be an empty space for that day. First and last dates should be the most recent and most further date on the data. If a date filter is applied, that should be the new first and last day on display
- now create another table with more global information like total signatures by each source, total signatures by week day. Any new KPI that could be usefull to understand the data and extract useful indicators.
- make it so i can collapse the 'daily signatures', 'analytics and kpi' and 'data' sections

