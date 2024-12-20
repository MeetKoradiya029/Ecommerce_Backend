export const isAdmin = async (req: any, res: any, next: any) => {

    try {
        // const { user_type } = req?.user;

        if (!req?.user || !req?.user?.user_type) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (req?.user?.user_type !== 1) {
            return res.status(403).json({ message: 'Access Denied!' });
        }

        next();

    } catch (error: any) {
        console.error('Error in isAdmin middleware:', error);
        return res.status(500).json({ message: 'Internal Server Error', error:error.message });
    }

}