import { createContext } from 'react';
import { Project, ProjectAction } from './Project';

export enum SidebarTab {
  Code,
  Search,
}

export const DispatchContext = createContext<React.Dispatch<ProjectAction>>(
  (action: ProjectAction) => action.newValue as Project
);
