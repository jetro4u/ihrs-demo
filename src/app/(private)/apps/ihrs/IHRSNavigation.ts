import { FuseNavItemType } from '@fuse/core/FuseNavigation/types/FuseNavItemType';

/**
 * health Navigation
 */
const IHRSNavigation: FuseNavItemType = {
	id: 'ihrs',
	title: 'IHRS',
	subtitle: 'Integrated Health Report System',
	icon: 'heroicons-outline:book-open',
	type: 'group',
	children: [
		{
			id: 'home',
			title: 'Home',
			type: 'item',
			icon: 'heroicons-outline:play',
			url: 'home'
		},
		{
			id: 'primary-care',
			title: 'Primary Care',
			type: 'group',
			icon: 'play_arrow',
			children: [
				{
					id: 'health-post',
					title: 'Health Post',
					type: 'item',
					icon: 'heroicons-outline:folder-open',
					url: 'health-post'
				},
				{
					id: 'health-clinic',
					title: 'Health Clinic',
					type: 'item',
					icon: 'heroicons-outline:folder-open',
					url: 'health-clinic'
				},
				{
					id: 'phc',
					title: 'Primary Health Care',
					type: 'item',
					icon: 'heroicons-outline:folder-open',
					url: 'phc'
				}
			]
		},
		{
			id: 'secondary-care',
			title: 'Secondary Care',
			type: 'group',
			icon: 'play_arrow',
			children: [
				{
					id: 'hospital-report',
					title: 'Hospital Reports',
					type: 'item',
					icon: 'heroicons-outline:folder-open',
					url: 'hospital-report'
				},
				{
					id: 'laboratory-report',
					title: 'Laboratory Report',
					type: 'item',
					icon: 'heroicons-outline:folder-open',
					url: 'laboratory-report'
				},
				{
					id: 'radiology-report',
					title: 'Radiology Test Report',
					type: 'item',
					icon: 'heroicons-outline:folder-open',
					url: 'radiology-report'
				},
				{
					id: 'pathology-report',
					title: 'Pathology Test Report',
					type: 'item',
					icon: 'heroicons-outline:folder-open',
					url: 'pathology-report'
				},
				{
					id: 'specialized-clinic',
					title: 'Specialized Outpatient Clinics',
					type: 'item',
					icon: 'heroicons-outline:folder-open',
					url: 'specialized-clinic'
				},
				{
					id: 'emergency-care-centers',
					title: 'Emergency Care Centers',
					type: 'item',
					icon: 'heroicons-outline:folder-open',
					url: 'emergency-care-centers'
				},
				{
					id: 'diagnostic-centers',
					title: 'Diagnostic Centers',
					type: 'item',
					icon: 'heroicons-outline:folder-open',
					url: 'diagnostic-centers'
				},
				{
					id: 'specialist-services',
					title: 'Specialist Services',
					type: 'item',
					icon: 'heroicons-outline:folder-open',
					url: 'specialist-services'
				}
			]
		},
		{
			id: 'tertiary-care',
			title: 'Tertiary Care',
			type: 'group',
			icon: 'play_arrow',
			children: [
				{
					id: 'specialist-hospitals',
					title: 'Specialist Hospitals',
					type: 'item',
					icon: 'heroicons-outline:folder-open',
					url: 'specialist-hospitals'
				},
				{
					id: 'teaching-hospitals',
					title: 'Teaching Hospitals',
					type: 'item',
					icon: 'heroicons-outline:folder-open',
					url: 'teaching-hospitals'
				},
				{
					id: 'specialized-referral-hospitals',
					title: 'Specialized Referral Hospitals',
					type: 'item',
					icon: 'heroicons-outline:folder-open',
					url: 'specialized-referral-hospitals'
				}
			]
		},
		{
			id: 'community-care',
			title: 'Community Care',
			type: 'group',
			icon: 'play_arrow',
			children: [
				{
					id: 'community-health-centers',
					title: 'Community Health Centers',
					type: 'item',
					icon: 'heroicons-outline:folder-open',
					url: 'community-health-centers'
				},
				{
					id: 'community-health-workers',
					title: 'Community Health Workers',
					type: 'item',
					icon: 'heroicons-outline:folder-open',
					url: 'community-health-workers'
				},
				{
					id: 'community-outreach-centers',
					title: 'Community Outreach Centers',
					type: 'item',
					icon: 'heroicons-outline:folder-open',
					url: 'community-outreach-centers'
				},
				{
					id: 'school-health-clinics',
					title: 'School Health Clinics',
					type: 'item',
					icon: 'heroicons-outline:folder-open',
					url: 'school-health-clinics'
				},
				{
					id: 'home-health-services',
					title: 'Home Health Services',
					type: 'item',
					icon: 'heroicons-outline:folder-open',
					url: 'home-health-services'
				},
			]
		}
	]
};

export default IHRSNavigation;
