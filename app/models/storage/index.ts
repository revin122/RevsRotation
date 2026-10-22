import { ListRepository } from './repository';

let repository: Promise<ListRepository> | undefined;

export function getRepository(): Promise<ListRepository> {
  if (!repository) {
    repository = (async () => {
      // Delay loading the native module so startup failures can show a retry UI.
      const { open } =
        require('@op-engineering/op-sqlite') as typeof import('@op-engineering/op-sqlite');
      const db = open({ name: 'revsrotation.sqlite' });
      try {
        const instance = new ListRepository(db);
        await instance.initialize();
        return instance;
      } catch (error) {
        db.close();
        throw error;
      }
    })().catch(error => {
      repository = undefined;
      throw error;
    });
  }
  return repository;
}
