/*
 * Copyright 2020 RoadieHQ
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { useState } from 'react';
import {
  InfoCard,
  InfoCardVariants,
  StructuredMetadataTable,
  MissingAnnotationEmptyState,
} from '@backstage/core-components';
import {
  isGithubSlugSet,
  GITHUB_PULL_REQUESTS_ANNOTATION,
} from '../../utils/isGithubSlugSet';
import { usePullRequestsStatistics } from '../../hooks/usePullRequestsStatistics';
import {
  Box,
  CircularProgress,
  FormControl,
  FormHelperText,
  MenuItem,
  Select,
  makeStyles,
  Link,
} from '@material-ui/core';
import { Entity } from '@backstage/catalog-model';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useGithubRepository } from '../../hooks/useGithubRepository';

const useStyles = makeStyles(theme => ({
  infoCard: {
    marginBottom: theme.spacing(3),
    '& + .MuiAlert-root': {
      marginTop: theme.spacing(3),
    },
    '& .MuiCardContent-root': {
      padding: theme.spacing(2, 1, 2, 2),
    },
    '& td': {
      whiteSpace: 'normal',
    },
  },
}));

type Props = {
  /** @deprecated The entity is now grabbed from context instead */
  entity?: Entity;
  variant?: InfoCardVariants;
};

const StatsCard = (props: Props) => {
  const { entity } = useEntity();
  const classes = useStyles();
  const [pageSize, setPageSize] = useState<number>(20);
  const projectName = isGithubSlugSet(entity);
  const [owner, repo] = (projectName ?? '/').split('/');
  const { value: isPrivate } = useGithubRepository({ owner, repo });

  const [
    { statsData, loading: loadingStatistics, error },
  ] = usePullRequestsStatistics({
    owner,
    repo,
    pageSize,
    state: 'closed',
    isPrivate,
  });

  if (error) {
    return error.message.includes('API rate limit') ? (
      <InfoCard
        title="Pull requests statistics"
        className={classes.infoCard}
        variant={props.variant}
      >
        API Rate Limit exceeded. Authenticated requests get a higher rate limit
        so after you log in and set up GitHub provider, this rate will be
        higher. You can read more in official
        <Link
          href="https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting"
          target="_blank"
          rel="noopener"
          style={{ paddingLeft: '0.3rem' }}
        >
          documentation
        </Link>
      </InfoCard>
    ) : (
      <InfoCard
        title="Pull requests statistics"
        className={classes.infoCard}
        variant={props.variant}
      >
        {error.message}
      </InfoCard>
    );
  }

  if (!projectName || projectName === '') {
    return (
      <MissingAnnotationEmptyState
        annotation={GITHUB_PULL_REQUESTS_ANNOTATION}
      />
    );
  }

  const metadata = {
    'average time of PR until merge': statsData?.avgTimeUntilMerge,
    'merged to closed ratio': statsData?.mergedToClosedRatio,
  };

  return (
    <InfoCard
      title="Pull requests statistics"
      className={classes.infoCard}
      variant={props.variant}
    >
      {loadingStatistics ? (
        <CircularProgress />
      ) : (
        <Box position="relative">
          <StructuredMetadataTable metadata={metadata} />
          <Box display="flex" justifyContent="flex-end">
            <FormControl>
              <Select
                value={pageSize}
                onChange={event => setPageSize(Number(event.target.value))}
              >
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
                <MenuItem value={50}>50</MenuItem>
                <MenuItem value={100}>100</MenuItem>
              </Select>
              <FormHelperText>Number of PRs</FormHelperText>
            </FormControl>
          </Box>
        </Box>
      )}
    </InfoCard>
  );
};

const PullRequestsStatsCard = (props: Props) => {
  const { entity } = useEntity();
  const projectName = isGithubSlugSet(entity);
  if (!projectName || projectName === '') {
    return (
      <MissingAnnotationEmptyState
        annotation={GITHUB_PULL_REQUESTS_ANNOTATION}
      />
    );
  }
  return <StatsCard {...props} />;
};

export default PullRequestsStatsCard;
