import Dexie, { type EntityTable } from 'dexie';
import type {
  ChecklistDone,
  DocumentItem,
  HouseProfile,
  MaterialItem,
  RepairRecord,
  Setting,
  UtilityRecord,
} from './types';

export class HomelogDB extends Dexie {
  houses!: EntityTable<HouseProfile, 'id'>;
  materials!: EntityTable<MaterialItem, 'id'>;
  repairs!: EntityTable<RepairRecord, 'id'>;
  documents!: EntityTable<DocumentItem, 'id'>;
  utilities!: EntityTable<UtilityRecord, 'id'>;
  checklist!: EntityTable<ChecklistDone, 'id'>;
  settings!: EntityTable<Setting, 'key'>;

  constructor(name = 'homelog') {
    super(name);
    this.version(1).stores({
      houses: 'id, updatedAt',
      materials: 'id, houseId, roomName, category, status, updatedAt',
      repairs: 'id, houseId, materialId, stage, occurredDate, updatedAt',
      documents: 'id, houseId, docType, updatedAt',
      utilities: 'id, houseId, month, kind',
      checklist: 'id, month',
      settings: 'key',
    });
  }
}

export const db = new HomelogDB();
