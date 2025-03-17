import FusePageSimple from '@fuse/core/FusePageSimple';
import { motion } from 'motion/react';
import FuseLoading from '@fuse/core/FuseLoading';
import FinanceDashboardAppHeader from './FinanceDashboardAppHeader';
import PreviousStatementWidget from './widgets/PreviousStatementWidget';
import CurrentStatementWidget from './widgets/CurrentStatementWidget';
import AccountBalanceWidget from './widgets/AccountBalanceWidget';
import RecentTransactionsWidget from './widgets/RecentTransactionsWidget';
import BudgetWidget from './widgets/BudgetWidget';
import { useGetFinanceDashboardWidgetsQuery } from './FinanceDashboardApi';

const container = {
	show: {
		transition: {
			staggerChildren: 0.04
		}
	}
};

const item = {
	hidden: { opacity: 0, y: 20 },
	show: { opacity: 1, y: 0 }
};

/**
 * The finance dashboard app.
 */
function FinanceDashboardApp() {
	const { data: widgets, isLoading } = useGetFinanceDashboardWidgetsQuery();

	if (isLoading) {
		return <FuseLoading />;
	}

	if (!widgets) {
		return null;
	}

	return (
		<FusePageSimple
			header={<FinanceDashboardAppHeader />}
			content={
				<div className="w-full px-6 md:px-8 pb-6">
					<motion.div
						className="w-full"
						variants={container}
						initial="hidden"
						animate="show"
					>
						<div className="grid grid-cols-1 xl:grid-cols-2 gap-8 w-full mt-8">
							<div className="grid gap-8 sm:grid-flow-col xl:grid-flow-row">
								<motion.div
									variants={item}
									className="flex flex-col flex-auto"
								>
									<PreviousStatementWidget />
								</motion.div>

								<motion.div
									variants={item}
									className="flex flex-col flex-auto"
								>
									<CurrentStatementWidget />
								</motion.div>
							</div>
							<motion.div
								variants={item}
								className="flex flex-col flex-auto"
							>
								<AccountBalanceWidget />
							</motion.div>
						</div>
						<div className="grid grid-cols-1 xl:grid-cols-3 gap-8 w-full mt-8">
							<motion.div
								variants={item}
								className="xl:col-span-2 flex flex-col flex-auto"
							>
								<RecentTransactionsWidget />
							</motion.div>
							<motion.div
								variants={item}
								className="flex flex-col flex-auto"
							>
								<BudgetWidget />
							</motion.div>
						</div>
					</motion.div>
				</div>
			}
		/>
	);
}

export default FinanceDashboardApp;
