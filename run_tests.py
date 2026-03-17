import os
import sys

os.environ["HH_PHONE"] = "+79622708648"
os.environ["HH_PASSWORD"] = "Bytccf2402"
os.environ["AUTO_APPLY_ENABLED"] = "true"

# Очищаем кэш модулей чтобы env подхватились
for mod in list(sys.modules.keys()):
    if mod in ("auto_apply", "test_apply"):
        del sys.modules[mod]

from test_apply import main
sys.exit(main())
