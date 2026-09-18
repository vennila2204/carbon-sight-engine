# Carbon Compass

Build the complete "Industrial Carbon Intelligence & Reduction Engine" web application in React, TypeScript, Tailwind CSS, React Router, Recharts, and Lucide React with full responsiveness across desktop, tablet, and mobile.

Include the following modules and architecture:

1. Role-Based Authentication & Navigation:
- Two roles: USER and ADMIN.
- Auth context with persistent demo accounts and a quick 1-click role switcher in the header for hackathon judges.
- Protected routes ensuring normal users cannot view or navigate to admin pages.
- Scalable layout with a collapsible sidebar, mobile drawer, and top navigation bar.

2. Multi-Industry Scalability:
- Header dropdown supporting Textile, Automotive, Chemical, Food & Beverage, Cement, and General Manufacturing.
- Emission sources, metrics, and default parameters adapt dynamically to the selected industry.

3. Factory Data Module (Dataset Ingestion & Management):
- Drag-and-drop & file browser supporting CSV and XLSX.
- File type and size validation, upload progress animation.
- Real-time client-side parsing showing: row count, column count, detected fields, missing values, and preview table (first 10-20 rows).
- Flexible column-mapping interface: map arbitrary uploaded column headers to required engine fields (electricity, diesel/fuel, production tonnes, transport, waste) with validation indicators.
- Replace/Remove dataset, Import Dataset action, and upload history table.
- Dedicated API service layer in `src/api/datasetApi.ts` using Axios and FormData for multipart/form-data upload to `POST /api/datasets/upload`, backed by a mock service fallback with realistic sample factory datasets.

4. Carbon Analysis Module:
- Calculated from the imported or active dataset.
- KPI summary: Total CO2e, Scope 1, Scope 2, Emission Intensity (tCO2e / unit), and Monthly Trend.
- Callout highlighting the single highest-emitting source/material.
- Charts using Recharts:
  * Emissions by Material/Source (Bar Chart)
  * Scope 1 vs Scope 2 & Source Contribution (Donut Chart)
  * Monthly Emissions Trend (Line Chart)
- Detailed Source Breakdown Table: Source, Consumption, Unit, Emission Factor, CO2e (tonnes), Percentage Contribution, and Trend.

5. Reduction Actions Module:
- Action catalog: Solar PV, Machine Motor Efficiency, Boiler Optimization, Load Shifting, Transport Logistics, Waste Heat Recovery, Biomass/Renewable Energy.
- Combination bundles (e.g. Bundle 1 vs Bundle 2) showing total cost in INR (₹), expected CO2e reduction, implementation timeline, production impact, and payback period.

6. OR-Tools Optimization Engine:
- Form to set Carbon Reduction Target, Sustainability Budget, and Constraints.
- OR-Tools solver results dashboard showing: Optimized Action Combination, Expected Reduction, Total Cost, Budget Used vs Remaining, and Before vs After comparison cards.

7. What-If Simulator:
- Interactive parameter sliders: Sustainability Budget, Production Volume, Grid Electricity Tariff, Fuel Price, Renewable Energy %, Carbon Abatement Target.
- Real-time scenario recalculation showing Current Plan vs Scenario Plan side-by-side with delta metrics.

8. Dynamic Re-Optimization:
- Scenario triggers (e.g., fuel price surge, grid outage, production increase) with side-by-side Old Plan vs Re-optimized Plan comparison.

9. Auditable Reports Module:
- Executive summary report generator with dataset metadata, footprint breakdown, selected actions, budget, and AI narrative explanation.
- Print-friendly layout and CSV export.

10. Admin Dataset & System Management:
- Table of all uploaded factory datasets across facilities with search, filter, sort, and pagination.
- Actions: Preview, Download, Replace, and Delete.
- Admin system configuration panel and activity audit log.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/17cd8176-2751-4f21-8c61-25d4007a3255).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
