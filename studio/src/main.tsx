import React from "react";
import {createRoot} from "react-dom/client";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import {App} from "./App";
import {Episodes} from "./pages/Episodes";
import {NewEpisode} from "./pages/NewEpisode";
import {EpisodePage} from "./pages/EpisodePage";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<App />}>
          <Route index element={<Episodes />} />
          <Route path="new" element={<NewEpisode />} />
          <Route path="ep/:id" element={<EpisodePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
