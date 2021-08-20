import { AllData } from './DataManagerType';

export type Task = {
  type: 'uses';
  text: string;
  data: AllData;
  id: number;
};

export type TaskResult = {
  uses: {
    [key: string]: Set<string>;
  };
  failedTypes: Set<string>;
  id: number;
  error: boolean | string;
};
