"""Asset downloads must match explicit provenance, size and digest before caching."""
import hashlib,sys,tempfile,unittest,subprocess
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'tools'))
import restore_website2_assets as restore
class AssetRestore(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.root=Path(self.tmp.name);self.data=b'preserved media';self.sha=hashlib.sha256(self.data).hexdigest()
        self.asset={'filename':'capture.mp4','canonicalPath':'assets/scenes/day/capture.mp4','sha256':self.sha,'size':len(self.data),'sourceUrl':'https://web.engr.oregonstate.edu/~randjosh/assets/scenes/day/capture.mp4'}
        self.patch=patch.object(restore,'ROOT',self.root);self.patch.start();self.addCleanup(self.patch.stop)
    def download(self,data,asset=None):
        import io
        opener=type('Opener',(),{'open':lambda _,request,timeout:io.BytesIO(data)})()
        with patch.object(restore.urllib.request,'build_opener',return_value=opener):return restore.read_bytes({'kind':'release-asset'},self.sha,[asset or self.asset])
    def test_public_bytes_are_verified_and_cached(self):
        self.assertEqual(self.download(self.data),self.data)
        self.assertEqual((self.root/'.asset-cache/capture.mp4').read_bytes(),self.data)
    def test_corruption_cannot_be_cached(self):
        with self.assertRaisesRegex(RuntimeError,'size/checksum'):self.download(b'changed')
        self.assertFalse((self.root/'.asset-cache/capture.mp4').exists())
    def test_bad_cache_fails_closed(self):
        p=self.root/'.asset-cache/capture.mp4';p.parent.mkdir();p.write_bytes(b'changed')
        with self.assertRaisesRegex(RuntimeError,'size/checksum'):restore.read_bytes({'kind':'release-asset'},self.sha,[self.asset])
    def test_absent_git_credentials_allow_only_the_manifest_fallback(self):
        asset=dict(self.asset,apiUrl='https://api.github.com/repos/owner/repo/releases/assets/1')
        with patch.object(restore,'credentials',side_effect=subprocess.CalledProcessError(1,'git')):
            self.assertEqual(self.download(self.data,asset),self.data)
    def test_git_chunks_restore_without_network_and_reject_corruption(self):
        part=self.root/'preserved.bin';part.write_bytes(self.data)
        blob=hashlib.sha1(b'blob '+str(len(self.data)).encode()+b'\0'+self.data).hexdigest()
        asset=dict(self.asset,kind='git-chunks',chunks=[{'path':'preserved.bin','blob':blob,'size':len(self.data)}])
        with patch.object(restore.urllib.request,'build_opener',side_effect=AssertionError('Network must not be needed')):
            self.assertEqual(restore.read_bytes({'kind':'release-asset'},self.sha,[asset]),self.data)
            (self.root/'.asset-cache/capture.mp4').unlink()
            part.write_bytes(b'corrupt media')
            with self.assertRaisesRegex(RuntimeError,'chunk mismatch'):
                restore.read_bytes({'kind':'release-asset'},self.sha,[asset])
if __name__=='__main__':unittest.main()
