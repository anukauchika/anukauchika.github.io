<script>
  import { goto }        from '$app/navigation'
  import AppTitle        from '@std/ui/app-title.svelte'
  import BtnIcon         from '@std/ui/btn-icon.svelte'
  import Island          from '@std/ui/island.svelte'
  import IslandTitle     from '@std/ui/island-title.svelte'
  import Stat            from '@std/ui/stat.svelte'
  import ProgressLine    from '@std/ui/progress-line.svelte'
</script>

<svelte:head>
  <title>HSK Elementary</title>
  <meta name="description" content="HSK 3.0 2026 Elementary: 1000 words, 655 characters. What HSK 2026 is and what changed" />
  <link rel="canonical" href="https://anukauchika.com/chinese/blog/hsk-elementary" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="HSK Elementary: The Numbers" />
  <meta property="og:description" content="HSK 3.0 2026 Elementary: 1000 words, 655 characters" />
  <meta property="og:url" content="https://anukauchika.com/chinese/blog/hsk-elementary" />
  <meta property="og:site_name" content="Anuka Uchika" />
  <meta property="og:image" content="https://anukauchika.com/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="https://anukauchika.com/og-image.png" />
  {@html `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "HSK Elementary: The Numbers",
    "description": "HSK 3.0 2026 Elementary: 1000 words, 655 characters",
    "datePublished": "2026-02-23",
    "author": { "@type": "Person", "name": "Anuka" },
    "publisher": { "@type": "Organization", "name": "Anuka Uchika" },
    "url": "https://anukauchika.com/chinese/blog/hsk-elementary"
  })}</script>`}
</svelte:head>

<main class="anuka-page">
  <Island sticky>
    <div class="anuka-row anuka-justify">
      <IslandTitle level={3}>HSK Elementary</IslandTitle>
      <BtnIcon icon="close" label="Back" onclick={() => goto('/chinese/blog')} />
    </div>
  </Island>
  <div class="anuka-stack">
    <AppTitle parts={['What is HSK']} />
    <Island prose>
      <p>
        If you're learning Chinese, you've heard of HSK.
        <strong>HSK</strong> (Hànyǔ Shuǐpíng Kǎoshì, <span>&#27721;&#35821;&#27700;&#24179;&#32771;&#35797;</span>, "Chinese Proficiency Test") is the only official standardized test
        for Mandarin Chinese proficiency, administered by the Chinese Ministry of Education.
        It's the Chinese equivalent of TOEFL/IELTS for English.
      </p>
      <p>You need HSK for:</p>
      <ul>
        <li><strong>University admission</strong> in China (most require HSK 4-5)</li>
        <li><strong>Scholarships</strong> — CSC and Confucius Institute scholarships require specific levels</li>
        <li><strong>Work visas</strong> — some employers and visa categories reference HSK</li>
        <li><strong>Self-benchmarking</strong> — the most structured way to measure your own progress</li>
      </ul>
    </Island>

    <AppTitle parts={['The Full Picture']} />
    <Island prose>
      <p>Here's what each level demands. Notice how the vocabulary accelerates — Level 3 alone adds 500 new words:</p>
      <p><strong>Elementary</strong></p>
      <ProgressLine fill={3} fillStrong={3}>
        {#snippet bottom()}<div class="anuka-row anuka-justify"><span class="anuka-mute anuka-sm">Level 1</span><span class="anuka-mute anuka-sm">300 words &middot; 246 chars</span></div>{/snippet}
      </ProgressLine>
      <ProgressLine fill={5} fillStrong={5}>
        {#snippet bottom()}<div class="anuka-row anuka-justify"><span class="anuka-mute anuka-sm">Level 2</span><span class="anuka-mute anuka-sm">500 words &middot; 371 chars</span></div>{/snippet}
      </ProgressLine>
      <ProgressLine fill={9} fillStrong={9}>
        {#snippet bottom()}<div class="anuka-row anuka-justify"><span class="anuka-mute anuka-sm">Level 3</span><span class="anuka-mute anuka-sm">1,000 words &middot; 655 chars</span></div>{/snippet}
      </ProgressLine>
      <p><strong>Intermediate</strong></p>
      <ProgressLine fill={18} fillStrong={18}>
        {#snippet bottom()}<div class="anuka-row anuka-justify"><span class="anuka-mute anuka-sm">Level 4</span><span class="anuka-mute anuka-sm">2,000 words &middot; 1,096 chars</span></div>{/snippet}
      </ProgressLine>
      <ProgressLine fill={33} fillStrong={33}>
        {#snippet bottom()}<div class="anuka-row anuka-justify"><span class="anuka-mute anuka-sm">Level 5</span><span class="anuka-mute anuka-sm">3,600 words &middot; 1,527 chars</span></div>{/snippet}
      </ProgressLine>
      <ProgressLine fill={49} fillStrong={49}>
        {#snippet bottom()}<div class="anuka-row anuka-justify"><span class="anuka-mute anuka-sm">Level 6</span><span class="anuka-mute anuka-sm">5,400 words &middot; 1,940 chars</span></div>{/snippet}
      </ProgressLine>
      <p><strong>Advanced</strong></p>
      <ProgressLine fill={100} fillStrong={100}>
        {#snippet bottom()}<div class="anuka-row anuka-justify"><span class="anuka-mute anuka-sm">Level 7-9</span><span class="anuka-mute anuka-sm">11,000 words &middot; 3,088 chars</span></div>{/snippet}
      </ProgressLine>
    </Island>
    <AppTitle parts={['Elementary Breakdown']} />
    <Island prose>
      <p>Let's look at what's actually inside these 1000 words. The dataset is split into 67 study groups of 15 words each:</p>
      <div class="anuka-row anuka-center">
        <Stat value={67} label="Groups" />
        <Stat value={1000} label="Words" />
        <Stat value={655} label="Characters" />
      </div>
      <p><strong>Words per level:</strong></p>
      <ProgressLine fill={30} fillStrong={30}>
        {#snippet bottom()}<div class="anuka-row anuka-justify"><span class="anuka-mute anuka-sm">Level 1</span><span class="anuka-mute anuka-sm">300 words &middot; 20 groups</span></div>{/snippet}
      </ProgressLine>
      <ProgressLine fill={20} fillStrong={20}>
        {#snippet bottom()}<div class="anuka-row anuka-justify"><span class="anuka-mute anuka-sm">Level 2</span><span class="anuka-mute anuka-sm">200 words &middot; 14 groups</span></div>{/snippet}
      </ProgressLine>
      <ProgressLine fill={50} fillStrong={50}>
        {#snippet bottom()}<div class="anuka-row anuka-justify"><span class="anuka-mute anuka-sm">Level 3</span><span class="anuka-mute anuka-sm">500 words &middot; 33 groups</span></div>{/snippet}
      </ProgressLine>
      <p>Level 3 is the big jump. It contains as many words as Levels 1 and 2 combined.</p>
      <div class="anuka-row anuka-right">
        <a href="/chinese?dataset=chinese-hskv3-elementary&tags=L1" class="anuka-btn">Explore L1</a>
        <a href="/chinese?dataset=chinese-hskv3-elementary&tags=L2" class="anuka-btn">Explore L2</a>
        <a href="/chinese?dataset=chinese-hskv3-elementary&tags=L3" class="anuka-btn">Explore L3</a>
      </div>
    </Island>

    <AppTitle parts={['HSK 3.0', 'The 2021 Reform']} />
    <Island prose>
      <p>
        In 2021, China announced a complete overhaul. The old 6-level system became a <strong>9-level framework</strong> organized into 3 bands.
        After years of pilot testing, <strong>HSK 3.0 fully replaces the old system in July 2026</strong>.
      </p>
      <p>The 3 bands:</p>
      <ul>
        <li><strong>Elementary (1-3)</strong> — survival Chinese: greetings, daily life, basic conversations</li>
        <li><strong>Intermediate (4-6)</strong> — professional use: work, media, presentations</li>
        <li><strong>Advanced (7-9)</strong> — mastery: academic discussion, professional interpretation</li>
      </ul>
      <p>Key changes from old HSK:</p>
      <ul>
        <li>Vocabulary requirements increased significantly, especially at lower levels</li>
        <li>New requirement: <strong>handwriting</strong> — character writing tested from Level 5+</li>
        <li>New requirement: <strong>translation</strong> — between Chinese and the test-taker's language</li>
        <li>4 dimensions tested: syllables, characters, vocabulary, grammar</li>
      </ul>
    </Island>

    <Island prose>
      <p>
        <strong>The elementary band is your foundation.</strong> After Level 3, you can read simple texts, menus, signs,
        and messages, and hold basic conversations.
      </p>
    </Island>

    <AppTitle parts={['What you Learn']} />
    <Island prose>
      <p>The vocabulary breaks down by category:</p>
      <div class="anuka-row anuka-center">
        <Stat value={424} label="Nouns" />
        <Stat value={276} label="Verbs" />
        <Stat value={90} label="Adjectives" />
        <Stat value={72} label="Grammar" />
      </div>
      <p>Beyond part of speech, the words cover practical domains:</p>
      <ul>
        <li><strong>Daily life</strong> — food (33), time (46), objects (27), locations (35)</li>
        <li><strong>People</strong> — family (41), social (14), education (27)</li>
        <li><strong>Getting around</strong> — travel (20), numbers (18)</li>
        <li><strong>Communication</strong> — pronouns (48), adverbs (52), conjunctions (14)</li>
        <li><strong>Classifiers</strong> — 33 measure words (CL:) — a uniquely Chinese concept</li>
      </ul>
      <p>
        Notice: <strong>grammar words (72) and classifiers (33)</strong> make up ~10% of the list.
        These aren't "vocabulary" in the traditional sense — they're the glue of Chinese sentences.
        Particles like <strong>&#30340;</strong>, <strong>&#20102;</strong>, <strong>&#30528;</strong>, <strong>&#36807;</strong> are among the most
        frequently used words in all of Chinese, and they're all in the elementary band.
      </p>
    </Island>

    <AppTitle parts={['Word Composition', 'Cumulative effect']} />
    <Island prose>
      <p>How many characters does a typical HSK word have?</p>
      <ProgressLine fill={36} fillStrong={36}>
        {#snippet bottom()}<div class="anuka-row anuka-justify"><span class="anuka-mute anuka-sm">1-character words</span><span class="anuka-mute anuka-sm">355 (35%)</span></div>{/snippet}
      </ProgressLine>
      <ProgressLine fill={59} fillStrong={59}>
        {#snippet bottom()}<div class="anuka-row anuka-justify"><span class="anuka-mute anuka-sm">2-character words</span><span class="anuka-mute anuka-sm">589 (59%)</span></div>{/snippet}
      </ProgressLine>
      <ProgressLine fill={5} fillStrong={5}>
        {#snippet bottom()}<div class="anuka-row anuka-justify"><span class="anuka-mute anuka-sm">3-character words</span><span class="anuka-mute anuka-sm">55 (6%)</span></div>{/snippet}
      </ProgressLine>
      <p>
        <strong>59% are 2-character words.</strong> Most words
        are built by combining simpler characters. Once you know the building blocks, compound words
        become guessable. For example: <strong>&#30005;&#35805;</strong> (electricity + speech = telephone),
        <strong>&#30005;&#33041;</strong> (electricity + brain = computer), <strong>&#30005;&#24433;</strong> (electricity + shadow = movie).
      </p>
      <p>
        The 355 single-character words are your core building blocks. Master these —
        they'll appear again and again inside the 2- and 3-character compounds.
      </p>
      <p>
        <strong>As you learn more words, you need fewer and fewer new characters</strong>. The ratio of unique characters to words drops steadily:
      </p>
      <ProgressLine fill={100} fillStrong={100}>
        {#snippet bottom()}<div class="anuka-row anuka-justify"><span class="anuka-mute anuka-sm">First 100 words</span><span class="anuka-mute anuka-sm">110 chars &middot; 1.10 chars/word</span></div>{/snippet}
      </ProgressLine>
      <ProgressLine fill={83} fillStrong={83}>
        {#snippet bottom()}<div class="anuka-row anuka-justify"><span class="anuka-mute anuka-sm">First 300 words</span><span class="anuka-mute anuka-sm">248 chars &middot; 0.83 chars/word</span></div>{/snippet}
      </ProgressLine>
      <ProgressLine fill={74} fillStrong={74}>
        {#snippet bottom()}<div class="anuka-row anuka-justify"><span class="anuka-mute anuka-sm">First 500 words</span><span class="anuka-mute anuka-sm">371 chars &middot; 0.74 chars/word</span></div>{/snippet}
      </ProgressLine>
      <ProgressLine fill={66} fillStrong={66}>
        {#snippet bottom()}<div class="anuka-row anuka-justify"><span class="anuka-mute anuka-sm">All 1000 words</span><span class="anuka-mute anuka-sm">655 chars &middot; 0.66 chars/word</span></div>{/snippet}
      </ProgressLine>
      <p>
        Same pattern per level: in Level 1, every new word introduces <strong>0.83</strong> new characters on average.
        By Level 2 it's <strong>0.63</strong>. By Level 3 — just <strong>0.56</strong>.
      </p>
      <p>
        This is the compounding effect. The characters you learn early are
        <strong>reused again and again</strong> in later words. The first 300 characters are the hardest grind.
        After that, you're increasingly combining familiar building blocks into new words
        rather than learning from scratch. The more you know, the easier it gets.
      </p>
    </Island>

    <AppTitle parts={['Official', 'Resources']} />
    <Island prose>
      <p>Primary sources:</p>
      <ul>
        <li><strong>Official HSK site:</strong> <a href="https://www.chinesetest.cn" target="_blank" rel="noopener">chinesetest.cn</a> — exam registration, sample papers, score lookup</li>
        <li><strong>Hanban / CLEC:</strong> <a href="http://www.chinese.cn" target="_blank" rel="noopener">chinese.cn</a> — the Center for Language Education and Cooperation, which administers HSK</li>
        <li><strong>Official word lists:</strong> Published as part of <em>&#22269;&#38469;&#20013;&#25991;&#25945;&#32946;&#20013;&#25991;&#27700;&#24179;&#31561;&#32423;&#26631;&#20934;</em> (International Chinese Language Education Chinese Proficiency Grading Standards)</li>
        <li><strong>Exam format:</strong> Listening + Reading + Writing (all levels). Translation added from Level 4+</li>
      </ul>
      <p>
        <strong>Important:</strong> the old HSK (6 levels) is still valid until July 2026.
        If you're taking the exam before then, check which version your test center offers.
        After July 2026, only HSK 3.0 applies.
      </p>
    </Island>

    <Island prose>
      <p>
        The HSK elementary is where most learners spend 6-12 months.
        1000 words, 655 unique characters, 67 groups.
        Structure beats motivation.
      </p>
      <div class="anuka-row anuka-right">
        <a href="/chinese/blog" class="anuka-btn">Read more insights</a>
        <a href="/chinese?dataset=chinese-hskv3-elementary" class="anuka-btn anuka-main">Start Drilling</a>
      </div>
    </Island>
  </div>
</main>
