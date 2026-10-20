<template>
  <div class="team-page bg-white text-slate-800">
    <!-- Page Header (matches team.html banner) -->
    <div class="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 py-20 text-center relative overflow-hidden">
      <div class="max-w-4xl mx-auto px-4 relative z-10">
        <h1 class="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">Our Team</h1>
        <nav class="flex justify-center items-center text-sm font-medium text-slate-300 gap-2">
          <router-link to="/" class="hover:text-amber-400">Home</router-link>
          <span>/</span>
          <span class="text-amber-400">Team</span>
        </nav>
      </div>
    </div>

    <!-- Instructors Team Grid (matches team.html) -->
    <section class="py-20 bg-slate-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto mb-14">
          <span class="inline-block text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-100/50 px-3 py-1 rounded-full mb-3">Instructors</span>
          <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Expert Conservatory Instructors</h2>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div v-for="(inst, idx) in instructors" :key="idx" class="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
            <div class="aspect-[4/5] overflow-hidden bg-slate-900 relative">
              <img :src="inst.image" :alt="inst.name" class="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div class="p-6 text-center">
              <h3 class="text-lg font-bold text-slate-900 mb-1 group-hover:text-amber-600 transition-colors">{{ inst.name }}</h3>
              <p class="text-xs font-bold text-amber-600 mb-1">{{ inst.designation }}</p>
              <p class="text-xs text-slate-500 mb-4">{{ inst.specialty }}</p>
              <div class="flex justify-center gap-2 pt-2 border-t border-slate-100">
                <span class="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-amber-500 hover:text-white flex items-center justify-center text-xs cursor-pointer transition-colors">f</span>
                <span class="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-amber-500 hover:text-white flex items-center justify-center text-xs cursor-pointer transition-colors">t</span>
                <span class="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-amber-500 hover:text-white flex items-center justify-center text-xs cursor-pointer transition-colors">in</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
const instructors = [
  {
    name: 'Maestro David Ochieng',
    designation: 'Chair of Piano & Composition',
    specialty: 'Classical Repertoire & Polyphony',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Dr. Sarah Wanjiku',
    designation: 'Director of Vocal Studies',
    specialty: 'Bel Canto & Contemporary Vocals',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Prof. Brian Otieno',
    designation: 'Principal Strings Instructor',
    specialty: 'Violin, Viola & Chamber Music',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Angela Muthoni',
    designation: 'Instructor of Gospel & Jazz Harmony',
    specialty: 'East African Gospel Progressions',
    image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=400&q=80',
  },
]
</script>
