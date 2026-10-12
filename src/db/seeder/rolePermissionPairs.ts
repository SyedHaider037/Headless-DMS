export interface RolePermissionPair {
    roleId: string;
    permissionId: string;
}

const pairKey = ({ roleId, permissionId }: RolePermissionPair) => `${roleId}:${permissionId}`;

// the pairs that are wanted but not stored yet; a pair listed twice is returned once
export const missingPairs = (wanted: RolePermissionPair[], existing: RolePermissionPair[]): RolePermissionPair[] => {
    const known = new Set(existing.map(pairKey));
    return wanted.filter((pair) => {
        const key = pairKey(pair);
        if (known.has(key)) return false;
        known.add(key);
        return true;
    });
};
