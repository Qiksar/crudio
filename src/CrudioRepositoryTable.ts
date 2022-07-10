import CrudioEntityInstance from './CrudioEntityInstance'

export default class CrudioRepositoryTable {
  public name: string = ''
  public entity: string = ''
  public count: number = 0
  public rows: CrudioEntityInstance[] = []

  constructor() {
    this.rows = []
  }

  clear() { 
    this.rows = [];
  }
  
  append(instance: CrudioEntityInstance) { 
    this.rows.push(instance);
  }

}
