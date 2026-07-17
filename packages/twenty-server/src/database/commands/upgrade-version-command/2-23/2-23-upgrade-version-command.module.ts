import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkspaceIteratorModule } from 'src/database/commands/command-runners/workspace-iterator.module';
import { ReconcileSystemRelationFieldUniversalIdentifierCommand } from 'src/database/commands/upgrade-version-command/2-23/2-23-workspace-command-1784291033000-reconcile-system-relation-field-universal-identifier.command';
import { UpgradePeopleDataLabsApplicationCommand } from 'src/database/commands/upgrade-version-command/2-23/2-23-workspace-command-1784291034000-upgrade-people-data-labs-application.command';
import { ApplicationUpgradeModule } from 'src/engine/core-modules/application/application-upgrade/application-upgrade.module';
import { ApplicationEntity } from 'src/engine/core-modules/application/application.entity';
import { FieldMetadataEntity } from 'src/engine/metadata-modules/field-metadata/field-metadata.entity';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';
import { WorkspaceMigrationRunnerModule } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-runner/workspace-migration-runner.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FieldMetadataEntity, ApplicationEntity]),
    WorkspaceMigrationRunnerModule,
    WorkspaceCacheModule,
    WorkspaceIteratorModule,
    ApplicationUpgradeModule,
  ],
  providers: [
    ReconcileSystemRelationFieldUniversalIdentifierCommand,
    UpgradePeopleDataLabsApplicationCommand,
  ],
})
export class V2_23_UpgradeVersionCommandModule {}
