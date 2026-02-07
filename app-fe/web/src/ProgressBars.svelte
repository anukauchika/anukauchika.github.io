<script>
  let { strokeProgress = 0, strokeMastery = 0, pinyinProgress = 0, pinyinMastery = 0 } = $props()
</script>

<div class="progress-bars">
  <div class="bar">
    <div class="fill-words" style="width: {strokeProgress}%"></div>
    <div class="fill-mastery" style="width: {strokeMastery}%"></div>
  </div>
  <div class="bar">
    <div class="fill-words" style="width: {pinyinProgress}%"></div>
    <div class="fill-mastery" style="width: {pinyinMastery}%"></div>
  </div>
</div>

<style>
  .progress-bars {
    display: flex;
    flex-direction: column;
    gap: 0;
    margin-top: 1.5rem;
    margin-bottom: -0.5rem;
  }

  .bar {
    position: relative;
    height: 4px;
    background: rgba(31, 111, 92, 0.12);
    overflow: hidden;
  }

  .bar:first-child {
    border-radius: 2px 2px 0 0;
  }

  .bar:last-child {
    border-radius: 0 0 2px 2px;
  }

  .fill-words {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: rgba(31, 111, 92, 0.5);
    border-radius: 2px;
    transition: width 0.4s ease;
  }

  .fill-mastery {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: var(--accent);
    border-radius: 2px;
    transition: width 0.4s ease;
  }
</style>
