import Dexie, { type EntityTable } from 'dexie';
import type {
  CatalogEntry,
  ChecklistDone,
  ContactItem,
  InspectionItem,
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
  contacts!: EntityTable<ContactItem, 'id'>;
  inspections!: EntityTable<InspectionItem, 'id'>;
  catalog!: EntityTable<CatalogEntry, 'id'>;

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
    this.version(2).stores({
      contacts: 'id, houseId, category, updatedAt',
      inspections: 'id, houseId, state',
    });
    this.version(3).stores({ catalog: 'id, item, category' });
  }
}

export const db = new HomelogDB();
