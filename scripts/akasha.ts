import fs from 'fs';
import { configs } from './misc';

const createAkasha = () => {
  type Akasha = {
    historyKeys: string[];
    mtime: {
      [key: string]: number;
    };
  };

  const akp = configs.akashaPath;
  const akasha = fs.existsSync(akp) ? (require(akp) as Akasha) : { historyKeys: [], mtime: {} };

  const isUpdated = (filePath: string) => {
    const stat = fs.statSync(filePath);
    const aks = akasha.mtime[filePath];
    return aks !== stat.mtimeMs;
  };

  const record = (filePath: string) => {
    const stat = fs.statSync(filePath);
    akasha.mtime[filePath] = stat.mtimeMs;
  };

  const save = () => {
    fs.writeFileSync(akp, JSON.stringify(akasha, null, 2), 'utf8');
  };

  return { save, record, isUpdated };
};

export const { save, record, isUpdated } = createAkasha();
