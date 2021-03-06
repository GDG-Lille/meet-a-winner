<template>
  <div class="draws mw-basic-layout">
    <div class="mw-content">
      <app-title :organization="organization"
                 :title="$tc('DRAWS.LABEL', Object.keys(draws).length)" />

      <md-progress-bar v-if="isLoading"
                       class="md-accent"
                       md-mode="indeterminate">
      </md-progress-bar>

      <md-card v-else-if="Object.keys(draws).length > 0">
        <md-tabs>
          <!-- TWITTER -->
          <md-tab id="tab-draws-twitter"
                  :md-disabled="Object.keys(drawsByType.twitter).length === 0"
                  :md-label="$t('DRAWS.TWITTER', [Object.keys(drawsByType.twitter).length])">

            <md-list class="md-dense md-double-line">
              <md-list-item v-for="(draw, id) in drawsByType.twitter"
                            :key="`draw_${id}`">
                <span class="md-list-item-text">
                  <span>{{ draw.name }}</span>
                  <span>
                    <strong :style="{color: draw.status === 'OPENED' ? '#4caf50' : 'inherit'}">{{ $t(`DRAW.STATUS.${draw.status}`) }}</strong>
                    &nbsp;-&nbsp;
                    {{ $t('DRAW.CREATED_AT') }} {{ draw.createdAt | date('v') }}
                    <span v-if="draw.participants !== undefined">
                      &nbsp;-&nbsp;
                      {{ $tc('DRAW.PARTICIPANTS', draw.participants.length, [draw.participants.length]) }}
                    </span>
                  </span>
                </span>

                <md-button v-if="draw.status === 'OPENED'"
                           class="md-list-action"
                           :disabled="loadingDraws.indexOf(id) !== -1"
                           @click="closeAndShuffle(id)">
                  <span v-if="loadingDraws.indexOf(id) !== -1">{{ $t('ACTIONS.IS_LOADING') }}</span>
                  <span v-else>{{ $t('ACTIONS.CLOSE_AND_SHUFFLE') }}</span>
                </md-button>
                <md-button v-else-if="draw.status === 'CLOSED' && draw.participants.length > 0"
                           class="md-list-action"
                           @click="drawLots(draw, id)">
                  {{ $t('ACTIONS.DRAW_LOTS') }}
                </md-button>
                <md-button v-else-if="draw.status === 'FINISHED'"
                           class="md-list-action"
                           @click="viewResults(draw, id)">
                  {{ $t('ACTIONS.SEE') }}
                </md-button>
              </md-list-item>
            </md-list>

          </md-tab>
        </md-tabs>
      </md-card>
    </div>

    <draws-participants :draw="selectedDraw"
                        :draw-id="selectedDrawId"
                        @closed="clearSelectedDraw"/>

    <md-speed-dial class="add-btn">
      <md-speed-dial-target>
        <md-icon>add</md-icon>
      </md-speed-dial-target>

      <md-speed-dial-content>
        <md-button class="md-icon-button"
                   @click="addTwitterDraw">
          <img src="../../assets/logo-twitter.svg"
               alt=""/>
        </md-button>

        <md-button class="md-icon-button">
          <img src="../../assets/logo-meetup.png"
               alt=""/>
        </md-button>
      </md-speed-dial-content>
    </md-speed-dial>
  </div>
</template>

<script>
import OrganizationsService from '@/services/OrganizationsService';
import AppTitle from '@/components/app-title/AppTitle';
import DrawsService from '@/services/DrawsService';
import DrawsParticipants from "./components/draws-participants/DrawsParticipants";

export default {
  name: 'draws',
  components: {DrawsParticipants, AppTitle},
  data() {
    return {
      isLoading: false,
      organization: {},
      draws: {},
      loadingDraws: [],
      selectedDrawId: null,
      selectedDraw : {},
    }
  },
  computed: {
    drawsByType() {
      const drawsByType = {};
      drawsByType.twitter = {};

      Object.keys(this.draws)
        .filter(drawId => this.draws[drawId].type === 'TWITTER')
        .forEach(drawId => drawsByType.twitter[drawId] = this.draws[drawId]);

      return drawsByType;
    },
  },
  beforeRouteEnter(to, from, next) {
    OrganizationsService.findOneForCurrentUser(to.params.organizationId)
      .then(organization => next(vm => vm.organization = organization))
      .catch(err => {
        console.error(err);
        next({ name: 'organizations' });
      })
  },
  created() {
    this.getDraws();
  },
  methods: {
    getDraws() {
      this.isLoading = true;

      DrawsService.findAllForOrganization(this.$route.params.organizationId)
        .onSnapshot(query => {
          const draws = {};
          query.forEach(doc => draws[doc.id] = doc.data());

          this.isLoading = false;
          this.draws = draws;
        });
    },
    addTwitterDraw() {
      this.$router.push({ name: 'draws-twitter-edit', params: { organizationId: this.$route.params.organizationId } });
    },
    closeAndShuffle(drawId) {
      this.loadingDraws.push(drawId);

      DrawsService.findAndShuffleAllParticipantsForTwitterDraw({ drawId : drawId })
        .then(() => this.loadingDraws.splice(this.loadingDraws.indexOf(drawId), 1))
        .catch(err => {
          console.error(err);
          this.loadingDraws.splice(this.loadingDraws.indexOf(drawId), 1);
          this.$store.commit('notification/setNotification', {
            active: true,
            message: this.$t('DRAWS.ERROR.DRAW_LOTS'),
            action: {
              label: this.$t('ACTIONS.RETRY'),
              handler: () => this.findAndShuffleAllParticipantsForTwitterDraw(drawId)
            }
          });
        })
    },
    drawLots(draw, drawId) {
      this.selectedDrawId = drawId;
      this.selectedDraw = draw;
    },
    clearSelectedDraw() {
      this.selectedDrawId = null;
      this.selectedDraw = {};
    },
    viewResults(draw, drawId) {
      this.selectedDrawId = drawId;
      this.selectedDraw = draw;
    }
  }
}
</script>

<style scoped lang="scss">
  .draws {
    .md-tab {
      padding: 0;
    }

    .md-list-item {
      filter: blur(0px);
      transition: all 300ms ease-in-out;
    }

    .add-btn {
      position: absolute;
      bottom: 20px;
      right: 20px;

      .md-icon-button {
        img {
          height: 24px;
          max-width: 100%;
        }
      }
    }
  }
</style>
