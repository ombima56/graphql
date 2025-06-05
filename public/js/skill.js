/**
 * Renders the skills overview section
 * @param {Object} userData - The processed user data
 */
export function renderSkillsOverview(userData) {
    try {
      if (!userData || !userData.skills || !userData.skills.length) {
        throw new Error('Skills data not available');
      }
  
      const container = document.getElementById('skillsOverview');
      if (!container) return;
  
      // Clear existing content
      container.innerHTML = '';
  
      // Find max value for scaling
      const maxAmount = Math.max(...userData.skills.map(skill => skill.amount));
  
      // Sort skills by amount in descending order
      const sortedSkills = [...userData.skills].sort((a, b) => b.amount - a.amount);
  
      // Define colors for variety
      const colors = ['blue-600', 'green-500', 'purple-500', 'yellow-500', 'red-500'];
  
      // Process and display skills
      sortedSkills.forEach((skill, index) => {
        const skillName = skill.type.replace('skill_', '').replace(/_/g, ' ');
        const percentage = skill.amount;
        const color = colors[index % colors.length];
  
        const skillDiv = document.createElement('div');
        skillDiv.className = 'space-y-3';
        skillDiv.innerHTML = `
          <div>
            <div class="flex justify-between mb-1">
              <span class="text-slate-500">${skillName}</span>
              <span class="text-${color} font-bold">${percentage}%</span>
            </div>
            <div class="bg-slate-200 h-2 border border-blue-200">
              <div class="bg-${color} h-full" style="width: ${percentage}%"></div>
            </div>
          </div>
        `;
  
        container.appendChild(skillDiv);
      });
    } catch (error) {
      console.error('Error rendering skills overview:', error);
      const container = document.querySelector('.bg-slate-50.border-2.border-blue-200.p-6 .grid.grid-cols-2.gap-4.font-mono.text-sm');
      if (container) {
        container.innerHTML = '<div class="text-red-500 p-4 col-span-2">Skills data unavailable</div>';
      }
    }
  }