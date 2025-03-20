import DiffMatchPatch from "diff-match-patch";
import './textDiff.css';

export function getTextDiff(previousText: string, currentText: string) {
    const dmp = new DiffMatchPatch();
    const diff = dmp.diff_main(previousText, currentText);
    return diff.map(([diffType, substring]: [number, string], index: number) => {
        return <span className={`text-diff ${diffType === 1 ? 'text-diff-added' : ''} ${diffType === -1 ? 'text-diff-removed' : ''}`} key={index}>{substring}</span>;
    })
}