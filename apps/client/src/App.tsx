import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { SummaryProvider } from "./context/SummaryContext";
import { FilterProvider } from "./context/FilterContext";
import { AppShell } from "./components/layout/AppShell";
import AboutAssumptionsPage from "./pages/AboutAssumptionsPage";
import GrantsPage from "./pages/GrantsPage";
import ProgramReviewPage from "./pages/ProgramReviewPage";

export default function App() {
  return (
    <BrowserRouter>
      <FilterProvider>
        <SummaryProvider>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<Navigate to="/program-review" replace />} />
              <Route path="/program-review" element={<ProgramReviewPage />} />
              <Route path="/grants" element={<GrantsPage />} />
              <Route path="/about-assumptions" element={<AboutAssumptionsPage />} />
            </Route>
          </Routes>
        </SummaryProvider>
      </FilterProvider>
    </BrowserRouter>
  );
}
