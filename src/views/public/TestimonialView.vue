<template>
  <div class="testimonial-page bg-white text-slate-800">
    <!-- Page Header (matches testimonial.html banner) -->
    <div class="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 py-20 text-center relative overflow-hidden">
      <div class="max-w-4xl mx-auto px-4 relative z-10">
        <h1 class="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">Testimonials</h1>
        <nav class="flex justify-center items-center text-sm font-medium text-slate-300 gap-2">
          <router-link to="/" class="hover:text-amber-400">Home</router-link>
          <span>/</span>
          <span class="text-amber-400">Testimonial</span>
        </nav>
      </div>
    </div>

    <!-- Testimonials Grid (matches testimonial.html) -->
    <section class="py-20 bg-slate-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto mb-14">
          <span class="inline-block text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-100/50 px-3 py-1 rounded-full mb-3">Student Reviews</span>
          <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Our Students Say!</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div v-for="(t, idx) in testimonials" :key="idx" class="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between text-center">
            <div>
              <img :src="t.avatar" :alt="t.name" class="w-16 h-16 rounded-full object-cover mx-auto mb-4 border-2 border-amber-500" />
              <h4 class="text-base font-bold text-slate-900">{{ t.name }}</h4>
              <p class="text-xs text-amber-600 font-semibold mb-3">{{ t.role }}</p>
              <div class="text-amber-500 text-xs mb-3">★★★★★</div>
              <p class="text-xs text-slate-600 leading-relaxed italic">"{{ t.quote }}"</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
const testimonials = [
  {
    name: 'Grace Mwangi',
    role: 'Conservatory Piano Graduate',
    quote: 'The module progression and rubric feedback gave me the discipline I needed to prepare for international competitions. Having my certificate verifiable online made university admission seamless.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
  },
  {
    name: 'Emmanuel Kiprotich',
    role: 'Music Director, Nairobi',
    quote: 'The African Gospel Keyboard workshop opened my eyes to passing chords and modulation techniques. The 1-on-1 tutoring sessions with Angela were worth every single shilling.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
  },
  {
    name: 'Cynthia Ndinda',
    role: 'Vocal Performance Student',
    quote: 'Studying with Dr. Sarah completely eliminated vocal strain and extended my upper register by a major third. The resumable video uploads made submitting assignments so convenient.',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80',
  },
  {
    name: 'Kevin Otieno',
    role: 'Orchestral Cello Student',
    quote: 'The thumb position tutorials and Bach Prelude video feedback were game changing. Having masterclasses right here in Nairobi is a blessing for classical musicians in Kenya.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
  },
]
</script>
