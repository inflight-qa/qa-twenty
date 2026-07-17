import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkspaceIteratorModule } from 'src/database/commands/command-runners/workspace-iterator.module';
import { ReconcileSystemRelationFieldUniversalIdentifierCommand } from 'src/database/commands/upgrade-version-command/2-23/2-23-workspace-command-1784276808000-reconcile-system-relation-field-universal-identifier.command';
import { FieldMetadataEntity } from 'src/engine/metadata-modules/field-metadata/field-metadata.entity';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';
import { WorkspaceMigrationRunnerModule } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-runner/workspace-migration-runner.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FieldMetadataEntity]),
    WorkspaceMigrationRunnerModule,
    WorkspaceCacheModule,
    WorkspaceIteratorModule,
  ],
  providers: [ReconcileSystemRelationFieldUniversalIdentifierCommand],
})
export class V2_23_UpgradeVersionCommandModule {}
