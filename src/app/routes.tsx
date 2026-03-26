import { createBrowserRouter } from "react-router";
import { getRouterBasename } from "./routerBasename";
import OpeningPage from "./pages/OpeningPage";
import WelcomePage from "./pages/WelcomePage";
import BasicInfoPage from "./pages/BasicInfoPage";
import LifeStagesPage from "./pages/LifeStagesPage";
import GeneratingPage from "./pages/GeneratingPage";
import ResultPage from "./pages/ResultPage";

export const router = createBrowserRouter(
  [
  {
    path: "/",
    Component: OpeningPage,
  },
  {
    path: "/welcome",
    Component: WelcomePage,
  },
  {
    path: "/basic-info",
    Component: BasicInfoPage,
  },
  {
    path: "/life-stages",
    Component: LifeStagesPage,
  },
  {
    path: "/generating",
    Component: GeneratingPage,
  },
  {
    path: "/result",
    Component: ResultPage,
  },
  ],
  { basename: getRouterBasename() }
);
