<template>
  <div class="about-page bg-white text-slate-800">
    <!-- Page Header (matches about.html banner) -->
    <div class="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 py-20 text-center relative overflow-hidden">
      <div class="max-w-4xl mx-auto px-4 relative z-10">
        <h1 class="text-4xl sm:text-5xl font-serif font-bold text-white tracking-tight mb-4">About Us</h1>
        <nav class="flex justify-center items-center text-sm font-medium text-slate-300 gap-2">
          <router-link to="/" class="hover:text-amber-400">Home</router-link>
          <span>/</span>
          <span class="text-amber-400">About</span>
        </nav>
      </div>
    </div>

    <!-- 4 Services / Value Props (matches about.html) -->
    <section class="py-16 bg-slate-50 border-b border-slate-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm text-center">
            <div class="w-14 h-14 rounded-xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-4 text-2xl font-bold">🎓</div>
            <h3 class="text-lg font-serif font-bold text-slate-900 mb-2">Skilled Instructors</h3>
            <p class="text-xs text-slate-600 leading-relaxed">Concert performers, orchestral soloists, and award-winning recording producers.</p>
          </div>
          <div class="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm text-center">
            <div class="w-14 h-14 rounded-xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-4 text-2xl font-bold">🌐</div>
            <h3 class="text-lg font-serif font-bold text-slate-900 mb-2">Online Classes</h3>
            <p class="text-xs text-slate-600 leading-relaxed">HD video streams, interactive fingering diagrams, and printable practice sheet music.</p>
          </div>
          <div class="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm text-center">
            <div class="w-14 h-14 rounded-xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-4 text-2xl font-bold">🏠</div>
            <h3 class="text-lg font-serif font-bold text-slate-900 mb-2">Home Projects</h3>
            <p class="text-xs text-slate-600 leading-relaxed">Structured weekly repertoire assignments with video jury submissions and rubrics.</p>
          </div>
          <div class="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm text-center">
            <div class="w-14 h-14 rounded-xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-4 text-2xl font-bold">📚</div>
            <h3 class="text-lg font-serif font-bold text-slate-900 mb-2">Book Library</h3>
            <p class="text-xs text-slate-600 leading-relaxed">Downloadable licensed sheet music, etude collections, and harmonic analysis charts.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- About Content Section -->
    <section class="py-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div class="lg:col-span-6">
            <img src="https://images.unsplash.com/photo-1514119412350-e174d90d280e?auto=format&fit=crop&w=800&q=80" alt="Bariton Campus" class="rounded-3xl shadow-xl w-full h-[450px] object-cover" />
          </div>
          <div class="lg:col-span-6 space-y-6">
            <span class="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full">Our Story</span>
            <h2 class="text-3xl sm:text-4xl font-serif font-bold text-slate-900 tracking-tight">Conservatory Discipline Meets African Musical Heritage</h2>
            <p class="text-slate-600 leading-relaxed">
              Bariton Music Academy was founded in Nairobi, Kenya, to bridge the gap between world-class classical conservatory rigor and the rich harmonic traditions of contemporary African jazz and gospel music.
            </p>
            <p class="text-slate-600 leading-relaxed">
              Our campus on Argwings Kodhek Road features acoustically isolated recording and teaching rooms, Steinway grand pianos, and recording infrastructure that connects our students with global performance opportunities.
            </p>
            <div class="grid grid-cols-2 gap-4 pt-2">
              <div class="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span class="block text-2xl font-display font-extrabold text-amber-600">1,200+</span>
                <span class="text-xs font-semibold text-slate-600">Graduated Musicians</span>
              </div>
              <div class="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span class="block text-2xl font-display font-extrabold text-amber-600">100%</span>
                <span class="text-xs font-semibold text-slate-600">Verifiable Credentials</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
</script>
