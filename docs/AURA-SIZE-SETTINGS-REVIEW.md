# Aura size setting

Settings → Presentation now includes **Aura size**, from **25% to 200%** in 5% steps. It defaults to 100%, saves in the existing local tuning profile, and participates in Reset all sliders. Older saves acquire the 100% default automatically.

The setting uniformly scales both teams' stationary rarity rings, orbiting flairs/trails and elite glows. It is applied after the small-creature aura minimum so 25% actually makes those auras smaller. Ring centers stay anchored, rear flair remains hidden, and the existing battle opacity reduction stays intact. Creature size, combat dimensions and stats are unchanged. The existing Settings movement preview now shows rarity auras live.

- [Desktop slider and live preview](evidence/aura-size-settings/desktop.png)
- [Phone layout](evidence/aura-size-settings/mobile.png)
- [Source/offline browser report](evidence/aura-size-settings/browser.json): slider persistence/reset, both-team live tuning, pause/resume, unchanged expedition, randomized preview and 320/390px layouts; zero errors and no offline external requests. Actual authored ring widths at 25/100/200% were 10/39/79 pixels, including the small-creature minimum.
- [33/33 focused unit checks](evidence/aura-size-settings/unit-tests.txt): default migration, range clamping, unchanged combat dimensions, rarity/team identity and 20% battle opacity.

Both offline HTML builds and diff checks pass. No creature anatomy or source artwork changed. The pre-existing `expedition.js` draft remains untouched. This PR stacks on #37 and contains only the aura-size setting.
