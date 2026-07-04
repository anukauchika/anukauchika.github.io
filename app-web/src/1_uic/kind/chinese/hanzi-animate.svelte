<script>
  let {
    char,
    size = 132,
    frameClass = 'anuka-sm',
    strokeColor: strokeColorProp,
    outlineColor: outlineColorProp,
  } = $props()

  let target = $state(null)
  let writer = null

  $effect(() => {
    const el = target
    if (!el || !char) return
    let cancelled = false
    import('hanzi-writer').then(({ default: HanziWriter }) => {
      if (cancelled) return
      const styles = getComputedStyle(document.documentElement)
      const strokeColor = strokeColorProp ?? styles.getPropertyValue('--anuka-color-text').trim()
      const outlineColor = outlineColorProp ?? styles.getPropertyValue('--anuka-color-bg-accent').trim()
      const radicalColor = styles.getPropertyValue('--anuka-color-primary').trim()
      writer = HanziWriter.create(el, char, {
        width: size,
        height: size,
        padding: 8,
        showCharacter: false,
        strokeAnimationSpeed: 1,
        delayBetweenStrokes: 120,
        delayBetweenLoops: 2500,
        strokeColor,
        outlineColor,
        radicalColor,
      })
      writer.loopCharacterAnimation()
    })
    return () => {
      cancelled = true
      writer?.cancelAnimation?.()
      writer = null
      el.innerHTML = ''
    }
  })
</script>

<div class="anuka-frame {frameClass}" style={`width: ${size}px`} translate="no" lang="zh-CN" bind:this={target}></div>
